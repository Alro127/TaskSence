"""
Context filter — deduplicates retrieved documents and returns top documents by score.

The same document can appear multiple times when several rewritten queries hit the
same Elasticsearch document. Deduplication is keyed on (index, id) and the
highest-scored copy is kept.

The number of documents returned is determined by (in priority order):
1. LLM's explicit requested_limit from classifier (if provided)
2. Intent-based limit: list/count queries return more (configurable, default 10)
3. Default limit for other queries (configurable, default 3)

Pagination:
- Returns metadata about available items beyond the limit
- Enables "show more" continuation with guardrails
"""

import logging
from typing import TypedDict

from app.chatbot.components import Document
from app.config.config import get_settings

logger = logging.getLogger(__name__)

# Deduplication key: (index, document_id)
_DocKey = tuple[str, str]


class FilterResult(TypedDict):
    """Result from filter_docs with pagination metadata."""
    documents: list[Document]
    has_more: bool
    total_available: int
    offset: int
    limit: int


def filter_docs(
    docs: list[Document],
    intent: str = "task_query",
    requested_limit: int | None = None,
) -> FilterResult:
    """
    Deduplicate and select top documents by score based on query intent and LLM request.

    Args:
        docs: Raw documents from one or more retrieve() calls.
        intent: Query intent (list_query, count_query, task_query, project_query, etc).
        requested_limit: Number of documents LLM requested (takes priority over intent-based limit).

    Returns:
        FilterResult with documents list and pagination metadata.
        If total_available > limit, has_more=True and user can ask to see more.
    """
    settings = get_settings()

    # Prioritize LLM's requested limit
    if requested_limit is not None:
        max_docs = requested_limit
    else:
        # Fallback to intent-based limit
        max_docs = settings.chatbot_max_context_docs
        if intent in ("list_query", "count_query"):
            max_docs = settings.chatbot_max_context_docs_for_list
    logger.info(
        "[filter] received=%d docs intent=%s requested_limit=%s max_docs=%d",
        len(docs),
        intent,
        requested_limit,
        max_docs,
    )

    # Keep highest-scored copy for each (index, id) pair
    best: dict[_DocKey, Document] = {}
    for doc in docs:
        key: _DocKey = (doc["index"], doc["id"])
        if key not in best or doc["score"] > best[key]["score"]:
            best[key] = doc

    unique = sorted(best.values(), key=lambda d: d["score"], reverse=True)
    top = unique[:max_docs]
    total_available = len(unique)
    has_more = len(unique) > max_docs

    logger.info(
        "[filter] unique=%d returning=%d has_more=%s",
        total_available,
        len(top),
        has_more,
    )

    return FilterResult(
        documents=top,
        has_more=has_more,
        total_available=total_available,
        offset=0,
        limit=max_docs,
    )
