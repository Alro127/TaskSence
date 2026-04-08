"""
Retriever — queries Qdrant for relevant task/project documents.

Search strategy
-----------------------------------------------------------------
Vector similarity search (k=5) using Google Gemini embeddings.

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

from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.chatbot.components import Document
from app.config.config import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)

_QDRANT_HOST = settings.qdrant_host
_COLLECTION_TASKS = settings.qdrant_collection_tasks
_COLLECTION_PROJECTS = settings.qdrant_collection_projects

# Number of documents returned per query
_TOP_K = 5
# Upper bound for count queries that include a text/vector component
_COUNT_LIMIT = 1000


# ── Qdrant client ─────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _get_client() -> QdrantClient:
    """Return a cached Qdrant client."""
    logger.info("[retriever] connecting to Qdrant at %s", _QDRANT_HOST)
    return QdrantClient(url=_QDRANT_HOST)


# ── Embedding ─────────────────────────────────────────────────────────────────

def _embed_query(query: str) -> list[float] | None:
    """
    Generate a query vector using Google Gemini embeddings.

    Returns None for empty/whitespace queries.
    Requires GEMINI_API_KEY to be set.
    """
    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    if not query.strip():
        return None

    api_key = settings.gemini_api_key
    if not api_key:
        raise ValueError("GEMINI_API_KEY is required for vector search")

    return GoogleGenerativeAIEmbeddings(
        model=settings.gemini_embedding_model,
        google_api_key=api_key,
    ).embed_query(query)


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
) -> list[Document]:

    if not query.strip():
        return []

    vector = _embed_query(query)
    if vector is None:
        return []

    scope_filter = _build_task_scope_filter(user_id, workspace_id, project_id, is_personal)

    logger.info("[retriever] tasks — vector search")
    results = _get_client().search(
        collection_name=_COLLECTION_TASKS,
        query_vector=vector,
        query_filter=scope_filter,
        limit=_TOP_K,
        with_payload=True,
    )
    return _parse_points(results, _COLLECTION_TASKS)


def _search_projects(query: str, workspace_id: int) -> list[Document]:
    if not query.strip():
        return []

    vector = _embed_query(query)
    if vector is None:
        return []

    logger.info("[retriever] projects — vector search")
    workspace_filter = Filter(
        must=[FieldCondition(key="workspaceId", match=MatchValue(value=workspace_id))]
    )
    results = _get_client().search(
        collection_name=_COLLECTION_PROJECTS,
        query_vector=vector,
        query_filter=workspace_filter,
        limit=_TOP_K,
        with_payload=True,
    )
    return _parse_points(results, _COLLECTION_PROJECTS)


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
            vector = _embed_query(query)
            if vector is not None:
                results = client.search(
                    collection_name=_COLLECTION_TASKS,
                    query_vector=vector,
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
) -> list[Document]:
    """
    Retrieve up to _TOP_K relevant documents from Qdrant.

    Args:
        query:        Search string (rewritten by the rewriter component).
        user_id:      Requesting user ID — used when is_personal=True.
        workspace_id: When provided, scopes task search to the workspace and
                      enables project document search.
        project_id:   When provided, scopes task search to this project
                      (takes priority over workspace_id).
        is_personal:  When True, applies user_id ownership filter on tasks.

    Returns:
        Documents sorted by descending relevance score.
    """

    if not query.strip():
        return []

    logger.info(
        "[retriever] query=%r user_id=%s workspace_id=%s project_id=%s is_personal=%s",
        query, user_id, workspace_id, project_id, is_personal,
    )

    task_docs = _search_tasks(query, user_id, workspace_id, project_id, is_personal)

    project_docs: list[Document] = []
    if workspace_id is not None:
        project_docs = _search_projects(query, workspace_id)
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
