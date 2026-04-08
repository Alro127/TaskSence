"""
Context filter — deduplicates retrieved documents and returns the top 3 by score.

The same document can appear multiple times when several rewritten queries hit the
same Elasticsearch document. Deduplication is keyed on (index, id) and the
highest-scored copy is kept.
"""

import logging

from app.chatbot.components import Document

logger = logging.getLogger(__name__)

_MAX_CONTEXT_DOCS = 3

# Deduplication key: (index, document_id)
_DocKey = tuple[str, str]


def filter_docs(docs: list[Document]) -> list[Document]:
    """
    Deduplicate and select the top _MAX_CONTEXT_DOCS documents by score.

    Args:
        docs: Raw documents from one or more retrieve() calls.

    Returns:
        Up to _MAX_CONTEXT_DOCS unique documents in descending score order.
    """
    logger.info("[filter] received=%d docs", len(docs))

    # Keep highest-scored copy for each (index, id) pair
    best: dict[_DocKey, Document] = {}
    for doc in docs:
        key: _DocKey = (doc["index"], doc["id"])
        if key not in best or doc["score"] > best[key]["score"]:
            best[key] = doc

    unique = sorted(best.values(), key=lambda d: d["score"], reverse=True)
    top = unique[:_MAX_CONTEXT_DOCS]

    logger.info(
        "[filter] unique=%d keeping=%d ids=%s",
        len(unique),
        len(top),
        [(d["index"], d["id"]) for d in top],
    )

    return top
