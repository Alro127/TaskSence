"""Qdrant-backed retrieval facade for chatbot context."""

import logging
from functools import lru_cache
from typing import Any, cast

from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import Filter

from app.chatbot.components import Document
from app.chatbot.components.retriever_count import count_tasks_impl
from app.chatbot.components.retriever_filters import build_task_scope_filter, task_user_filter
from app.chatbot.components.retriever_search import search_projects_impl, search_tasks_impl
from app.client.embedding import get_embedding
from app.config.config import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)

_QDRANT_HOST = settings.qdrant_host
_COLLECTION_TASKS = settings.qdrant_collection_tasks
_COLLECTION_PROJECTS = settings.qdrant_collection_projects

# Default candidate pool when no intent-aware limit is provided.
_TOP_K_DEFAULT = settings.chatbot_retrieval_top_k
# Upper bound for count queries that include a text/vector component
_COUNT_LIMIT = 1000


@lru_cache(maxsize=1)
def _get_client() -> QdrantClient:
    """Return a cached Qdrant client."""
    logger.info("[retriever] connecting to Qdrant at %s", _QDRANT_HOST)
    return QdrantClient(url=_QDRANT_HOST)


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


def _task_user_filter(user_id: int) -> Filter:
    return task_user_filter(user_id)


# ── Scope filter ──────────────────────────────────────────────────────────────

def _build_task_scope_filter(
    user_id: int,
    workspace_id: int | None,
    project_id: int | None = None,
    is_personal: bool = False,
) -> Filter | None:
    return build_task_scope_filter(user_id, workspace_id, project_id, is_personal)


def _search_tasks(
    query: str,
    user_id: int,
    workspace_id: int | None = None,
    project_id: int | None = None,
    is_personal: bool = False,
    limit: int | None = None,
) -> list[Document]:
    return search_tasks_impl(
        query,
        user_id,
        workspace_id,
        project_id,
        is_personal,
        limit,
        default_top_k=_TOP_K_DEFAULT,
        collection_tasks=_COLLECTION_TASKS,
        embed_query=_embed_query,
        get_collection_vector_dim=_get_collection_vector_dim,
        build_task_scope_filter=_build_task_scope_filter,
        vector_search=_vector_search,
        parse_points=_parse_points,
    )


def _search_projects(query: str, workspace_id: int, limit: int | None = None) -> list[Document]:
    return search_projects_impl(
        query,
        workspace_id,
        limit,
        default_top_k=_TOP_K_DEFAULT,
        collection_projects=_COLLECTION_PROJECTS,
        embed_query=_embed_query,
        get_collection_vector_dim=_get_collection_vector_dim,
        vector_search=_vector_search,
        parse_points=_parse_points,
    )


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


def count_tasks(
    query: str,
    workspace_id: int | None = None,
    project_id: int | None = None,
    is_personal: bool = False,
    user_id: int | None = None,
) -> int:
    return count_tasks_impl(
        query,
        workspace_id,
        project_id,
        is_personal,
        user_id,
        collection_tasks=_COLLECTION_TASKS,
        count_limit=_COUNT_LIMIT,
        get_client=_get_client,
        build_task_scope_filter=_build_task_scope_filter,
        get_collection_vector_dim=_get_collection_vector_dim,
        embed_query=_embed_query,
        vector_search=_vector_search,
    )


def retrieve(
    query: str,
    user_id: int,
    workspace_id: int | None = None,
    project_id: int | None = None,
    is_personal: bool = False,
    requested_limit: int | None = None,
) -> list[Document]:
    """Retrieve relevant task/project documents sorted by score."""
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
