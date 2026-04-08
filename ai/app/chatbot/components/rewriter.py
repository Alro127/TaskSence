"""
Rewriter — decomposes a complex user query into 2-3 targeted Elasticsearch search strings.

Rewriting improves recall by covering different semantic angles of the original question.
All output queries are in English regardless of the input language.
"""

import json
import logging
from functools import lru_cache
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage

from app.common.llm import get_llm, parse_llm_json

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "rewrite.txt"
_MAX_QUERIES = 3


@lru_cache(maxsize=1)
def _load_prompt() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


def rewrite(query: str) -> list[str]:
    """
    Expand the query into multiple focused search strings.

    Args:
        query: Original user question (any language).

    Returns:
        List of 2-3 English search strings.
        Falls back to [query] if the LLM output cannot be parsed.
    """
    logger.info("[rewriter] query=%r", query)

    messages = [
        SystemMessage(content=_load_prompt()),
        HumanMessage(content=query),
    ]

    raw: str = get_llm().invoke(messages).content

    try:
        queries = parse_llm_json(raw)
        if not isinstance(queries, list) or not queries:
            raise ValueError("expected non-empty list")
    except (json.JSONDecodeError, ValueError):
        logger.warning("[rewriter] unparseable LLM output=%r — falling back to original query", raw)
        return [query]

    result = [str(q) for q in queries[:_MAX_QUERIES]]
    logger.info("[rewriter] rewritten=%s", result)
    return result
