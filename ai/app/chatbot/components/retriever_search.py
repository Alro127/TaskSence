"""Index-level Qdrant search helpers for chatbot retrieval."""

from __future__ import annotations

import logging
from collections.abc import Callable

from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.chatbot.components import Document

logger = logging.getLogger(__name__)

EmbedFn = Callable[[str, int | None], list[float] | None]
DimFn = Callable[[str], int | None]
ParseFn = Callable[[object, str], list[Document]]
ScopeFn = Callable[[int, int | None, int | None, bool], Filter | None]
VectorSearchFn = Callable[[str, list[float], Filter | None, int, bool], object]


def search_tasks_impl(
    query: str,
    user_id: int,
    workspace_id: int | None,
    project_id: int | None,
    is_personal: bool,
    limit: int | None,
    *,
    default_top_k: int,
    collection_tasks: str,
    embed_query: EmbedFn,
    get_collection_vector_dim: DimFn,
    build_task_scope_filter: ScopeFn,
    vector_search: VectorSearchFn,
    parse_points: ParseFn,
) -> list[Document]:
    if not query.strip():
        return []

    top_k = limit if limit is not None else default_top_k
    expected_dim = get_collection_vector_dim(collection_tasks)
    vector = embed_query(query, expected_dim)
    if vector is None:
        return []

    scope_filter = build_task_scope_filter(user_id, workspace_id, project_id, is_personal)
    logger.info("[retriever] tasks - vector search limit=%d", top_k)
    results = vector_search(collection_tasks, vector, scope_filter, top_k, True)
    return parse_points(results, collection_tasks)


def search_projects_impl(
    query: str,
    workspace_id: int,
    limit: int | None,
    *,
    default_top_k: int,
    collection_projects: str,
    embed_query: EmbedFn,
    get_collection_vector_dim: DimFn,
    vector_search: VectorSearchFn,
    parse_points: ParseFn,
) -> list[Document]:
    if not query.strip():
        return []

    top_k = limit if limit is not None else default_top_k
    expected_dim = get_collection_vector_dim(collection_projects)
    vector = embed_query(query, expected_dim)
    if vector is None:
        return []

    logger.info("[retriever] projects - vector search limit=%d", top_k)
    workspace_filter = Filter(
        must=[FieldCondition(key="workspaceId", match=MatchValue(value=workspace_id))]
    )
    results = vector_search(collection_projects, vector, workspace_filter, top_k, True)
    return parse_points(results, collection_projects)
