"""Task count helper for Qdrant-backed retrieval."""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from qdrant_client.models import Filter

logger = logging.getLogger(__name__)

ClientFn = Callable[[], Any]
DimFn = Callable[[str], int | None]
EmbedFn = Callable[[str, int | None], list[float] | None]
ScopeFn = Callable[[int, int | None, int | None, bool], Filter | None]
VectorSearchFn = Callable[[str, list[float], Filter | None, int, bool], object]


def count_tasks_impl(
    query: str,
    workspace_id: int | None,
    project_id: int | None,
    is_personal: bool,
    user_id: int | None,
    *,
    collection_tasks: str,
    count_limit: int,
    get_client: ClientFn,
    build_task_scope_filter: ScopeFn,
    get_collection_vector_dim: DimFn,
    embed_query: EmbedFn,
    vector_search: VectorSearchFn,
) -> int:
    client = get_client()
    scope_filter = build_task_scope_filter(user_id or 0, workspace_id, project_id, is_personal)

    try:
        if query.strip():
            expected_dim = get_collection_vector_dim(collection_tasks)
            vector = embed_query(query, expected_dim)
            if vector is not None:
                results = vector_search(collection_tasks, vector, scope_filter, count_limit, False)
                total = len(results)  # type: ignore[arg-type]
            else:
                total = _exact_count(client, collection_tasks, scope_filter)
        else:
            total = _exact_count(client, collection_tasks, scope_filter)

        logger.info(
            "[retriever] count_tasks query=%r project_id=%s workspace_id=%s is_personal=%s -> %d",
            query,
            project_id,
            workspace_id,
            is_personal,
            total,
        )
        return total
    except Exception as exc:
        logger.warning("[retriever] count_tasks failed: %s", exc)
        return 0


def _exact_count(client: Any, collection_name: str, scope_filter: Filter | None) -> int:
    result = client.count(collection_name=collection_name, count_filter=scope_filter, exact=True)
    return int(result.count)
