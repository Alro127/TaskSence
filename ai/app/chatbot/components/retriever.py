"""
Retriever — queries Qdrant for relevant task/project documents.

Search strategy
-----------------------------------------------------------------
Vector similarity search respecting LLM's requested_limit from classifier.
If no limit requested, uses default _TOP_K_DEFAULT (50).

Task scope priority (_build_task_scope_filter)
----------------------------------------------
1. is_personal=True → user ownership filter (createdById / assignees[].id)
2. project_id       → filter by projectId
3. workspace_id     → filter by workspaceId
4. none             → no ownership filter; query text is the only constraint

Projects: always filtered by workspaceId when workspace_id is provided.
          Skipped entirely when workspace_id is None.
"""

import logging
from functools import lru_cache
from typing import Any, cast

from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.chatbot.components import Document
from app.client.embedding import get_embedding
from app.config.config import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)

_QDRANT_HOST = settings.qdrant_host
_COLLECTION_TASKS = settings.qdrant_collection_tasks
_COLLECTION_PROJECTS = settings.qdrant_collection_projects

# Default number of documents returned per query (LLM can override via requested_limit)
_TOP_K_DEFAULT = 50
# Upper bound for count queries that include a text/vector component
_COUNT_LIMIT = 1000


# ── Qdrant client ─────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _get_client() -> QdrantClient:
    """Return a cached Qdrant client."""
    logger.info("[retriever] connecting to Qdrant at %s", _QDRANT_HOST)
    return QdrantClient(url=_QDRANT_HOST)


# ── Embedding ─────────────────────────────────────────────────────────────────

def _embed_query(query: str, output_dimensionality: int | None = None) -> list[float] | None:
    """
    Generate a query vector using the configured embedding client.

    Returns None for empty/whitespace queries.
    """
    if not query.strip():
        return None

    embeddings = get_embedding()

    if output_dimensionality is None:
        return [float(v) for v in embeddings.embed_query(query)]

    # Some embedding providers support output_dimensionality to match index schema.
    # If unsupported, fall back to provider default dimensions.
    try:
        embed_query_any = cast(Any, embeddings).embed_query
        vector = embed_query_any(query, output_dimensionality=output_dimensionality)
        return [float(v) for v in vector]
    except TypeError:
        logger.warning(
            "[retriever] embedding client does not support output_dimensionality=%s; using model default",
            output_dimensionality,
        )
        return [float(v) for v in embeddings.embed_query(query)]


@lru_cache(maxsize=8)
def _get_collection_vector_dim(collection_name: str) -> int | None:
    """Return expected vector size for a collection, if available."""
    try:
        collection_info = _get_client().get_collection(collection_name=collection_name)
        vectors = cast(Any, collection_info.config.params.vectors)

        if hasattr(vectors, "size"):
            return int(cast(Any, vectors).size)

        if isinstance(vectors, dict) and vectors:
            first = next(iter(vectors.values()))
            if hasattr(first, "size"):
                return int(first.size)

        logger.warning(
            "[retriever] could not infer vector size for collection=%s", collection_name
        )
        return None
    except Exception as exc:
        logger.warning(
            "[retriever] failed to read collection vector size for %s: %s",
            collection_name,
            exc,
        )
        return None


# ── Ownership filters ─────────────────────────────────────────────────────────

def _task_user_filter(user_id: int) -> Filter:
    """
    Qdrant filter: a task belongs to the user when they created it OR are an assignee.

    Uses `assignees[].id` key to match nested array objects stored in the payload.
    """
    return Filter(
        should=[
            FieldCondition(key="createdById", match=MatchValue(value=user_id)),
            FieldCondition(key="assignees[].id", match=MatchValue(value=user_id)),
        ]
    )


# ── Scope filter ──────────────────────────────────────────────────────────────

def _build_task_scope_filter(
    user_id: int,
    workspace_id: int | None,
    project_id: int | None = None,
    is_personal: bool = False,
) -> Filter | None:
    """
    Choose the appropriate Qdrant filter for task queries.

    Priority (first match wins):
      1. is_personal=True  → user_id filter (createdById / assignees)
      2. project_id        → filter by projectId
      3. workspace_id      → filter by workspaceId
      4. none of the above → None (no ownership constraint)
    """
    if is_personal:
        return _task_user_filter(user_id)
    if project_id is not None:
        return Filter(must=[FieldCondition(key="projectId", match=MatchValue(value=project_id))])
    if workspace_id is not None:
        return Filter(must=[FieldCondition(key="workspaceId", match=MatchValue(value=workspace_id))])
    return None


# ── Index-level search ────────────────────────────────────────────────────────

def _search_tasks(
    query: str,
    user_id: int,
    workspace_id: int | None = None,
    project_id: int | None = None,
    is_personal: bool = False,
    limit: int | None = None,
) -> list[Document]:

    if not query.strip():
        return []

    top_k = limit if limit is not None else _TOP_K_DEFAULT
    expected_dim = _get_collection_vector_dim(_COLLECTION_TASKS)
    vector = _embed_query(query, output_dimensionality=expected_dim)
    if vector is None:
        return []

    scope_filter = _build_task_scope_filter(user_id, workspace_id, project_id, is_personal)

    logger.info("[retriever] tasks — vector search limit=%d", top_k)
    results = _vector_search(
        collection_name=_COLLECTION_TASKS,
        vector=vector,
        query_filter=scope_filter,
        limit=top_k,
        with_payload=True,
    )
    return _parse_points(results, _COLLECTION_TASKS)


def _search_projects(query: str, workspace_id: int, limit: int | None = None) -> list[Document]:
    if not query.strip():
        return []

    top_k = limit if limit is not None else _TOP_K_DEFAULT
    expected_dim = _get_collection_vector_dim(_COLLECTION_PROJECTS)
    vector = _embed_query(query, output_dimensionality=expected_dim)
    if vector is None:
        return []

    logger.info("[retriever] projects — vector search limit=%d", top_k)
    workspace_filter = Filter(
        must=[FieldCondition(key="workspaceId", match=MatchValue(value=workspace_id))]
    )
    results = _vector_search(
        collection_name=_COLLECTION_PROJECTS,
        vector=vector,
        query_filter=workspace_filter,
        limit=top_k,
        with_payload=True,
    )
    return _parse_points(results, _COLLECTION_PROJECTS)


def _vector_search(
    collection_name: str,
    vector: list[float],
    query_filter: Filter | None,
    limit: int,
    with_payload: bool,
):
    """
    Run vector similarity search across qdrant-client versions.

    qdrant-client>=1.11 uses `query_points`; older versions use `search`.
    """
    client = _get_client()

    try:
        if hasattr(client, "query_points"):
            response = client.query_points(
                collection_name=collection_name,
                query=vector,
                query_filter=query_filter,
                limit=limit,
                with_payload=with_payload,
            )
            return response.points

        # Backward compatibility for older qdrant-client versions.
        legacy_search = getattr(client, "search", None)
        if legacy_search is None:
            logger.warning(
                "[retriever] qdrant client has no query_points/search API for collection=%s",
                collection_name,
            )
            return []

        return legacy_search(
            collection_name=collection_name,
            query_vector=vector,
            query_filter=query_filter,
            limit=limit,
            with_payload=with_payload,
        )
    except UnexpectedResponse as exc:
        # Prevent pipeline crashes when model/index dimensions drift.
        logger.warning(
            "[retriever] vector search failed for collection=%s: %s",
            collection_name,
            exc,
        )
        return []


# ── Point parsing ─────────────────────────────────────────────────────────────

def _parse_points(results, collection: str) -> list[Document]:
    return [
        Document(
            id=str(point.id),
            index=collection,
            score=point.score,
            source=point.payload or {},
        )
        for point in results
    ]


# ── Aggregation (count) ───────────────────────────────────────────────────────

def count_tasks(
    query: str,
    workspace_id: int | None = None,
    project_id: int | None = None,
    is_personal: bool = False,
    user_id: int | None = None,
) -> int:
    """
    Return the number of tasks matching the query.

    When a text query is provided, uses vector similarity search with limit
    _COUNT_LIMIT to estimate the count of semantically matching tasks.
    When no text query is provided, uses the Qdrant count API for an exact count.

    Args:
        query:        Search string extracted from the user query.
        workspace_id: Optional workspace scope.
        project_id:   Optional project scope (takes priority over workspace).
        is_personal:  When True, scope to the requesting user's own tasks.
        user_id:      Required when is_personal=True.

    Returns:
        Integer count of matching tasks.
    """
    client = _get_client()
    scope_filter = _build_task_scope_filter(
        user_id or 0, workspace_id, project_id, is_personal
    )

    try:
        if query.strip():
            expected_dim = _get_collection_vector_dim(_COLLECTION_TASKS)
            vector = _embed_query(query, output_dimensionality=expected_dim)
            if vector is not None:
                results = _vector_search(
                    collection_name=_COLLECTION_TASKS,
                    vector=vector,
                    query_filter=scope_filter,
                    limit=_COUNT_LIMIT,
                    with_payload=False,
                )
                total = len(results)
            else:
                result = client.count(
                    collection_name=_COLLECTION_TASKS,
                    count_filter=scope_filter,
                    exact=True,
                )
                total = result.count
        else:
            result = client.count(
                collection_name=_COLLECTION_TASKS,
                count_filter=scope_filter,
                exact=True,
            )
            total = result.count

        logger.info(
            "[retriever] count_tasks query=%r project_id=%s workspace_id=%s is_personal=%s → %d",
            query, project_id, workspace_id, is_personal, total,
        )
        return total
    except Exception as exc:
        logger.warning("[retriever] count_tasks failed: %s", exc)
        return 0


# ── Public API ────────────────────────────────────────────────────────────────

def retrieve(
    query: str,
    user_id: int,
    workspace_id: int | None = None,
    project_id: int | None = None,
    is_personal: bool = False,
    requested_limit: int | None = None,
) -> list[Document]:
    """
    Retrieve relevant documents from Qdrant, respecting LLM's requested_limit.

    Args:
        query:            Search string (rewritten by the rewriter component).
        user_id:          Requesting user ID — used when is_personal=True.
        workspace_id:     When provided, scopes task search to the workspace and
                          enables project document search.
        project_id:       When provided, scopes task search to this project
                          (takes priority over workspace_id).
        is_personal:      When True, applies user_id ownership filter on tasks.
        requested_limit:  LLM's requested item count. If None, uses _TOP_K_DEFAULT.

    Returns:
        Documents sorted by descending relevance score.
    """

    if not query.strip():
        return []

    logger.info(
        "[retriever] query=%r user_id=%s workspace_id=%s project_id=%s is_personal=%s requested_limit=%s",
        query, user_id, workspace_id, project_id, is_personal, requested_limit,
    )

    task_docs = _search_tasks(query, user_id, workspace_id, project_id, is_personal, limit=requested_limit)

    project_docs: list[Document] = []
    if workspace_id is not None:
        project_docs = _search_projects(query, workspace_id, limit=requested_limit)
    else:
        logger.debug("[retriever] no workspace_id — project search skipped")

    all_docs = sorted(task_docs + project_docs, key=lambda d: d["score"], reverse=True)

    logger.info(
        "[retriever] fetched total=%d (tasks=%d projects=%d) ids=%s",
        len(all_docs),
        len(task_docs),
        len(project_docs),
        [d["id"] for d in all_docs],
    )

    return all_docs
