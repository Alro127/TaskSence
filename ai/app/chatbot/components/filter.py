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
import re
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
    query: str | None = None,
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

    unique = sorted(
        best.values(),
        key=lambda d: _rerank_score(d, intent=intent, query=query),
        reverse=True,
    )
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


def _rerank_score(doc: Document, intent: str, query: str | None) -> float:
    """Blend retrieval score with deterministic TaskSense relevance signals."""
    score = float(doc.get("score", 0.0))
    source = doc.get("source", {})
    index = str(doc.get("index", "")).lower()

    if score >= 0.99:
        score += 0.2  # SQL-template hits are already scoped and ordered by source-of-truth data.

    if intent in ("list_query", "count_query") and "task" in index:
        score += 0.08
    if intent == "project_query" and "project" in index:
        score += 0.08

    searchable = " ".join(
        str(source.get(key, ""))
        for key in ("title", "name", "description", "status", "priority")
        if source.get(key) is not None
    ).lower()
    for token in _query_tokens(query):
        if token in searchable:
            score += 0.03

    if source.get("dueDate"):
        score += 0.02
    if source.get("status") == "DONE" and intent != "count_query":
        score -= 0.03

    return score


def _query_tokens(query: str | None) -> set[str]:
    if not query:
        return set()
    return {token for token in re.findall(r"[\w-]+", query.lower()) if len(token) >= 3}
