"""
Classifier — decides whether a user query is relevant to task/project management.

Uses a zero-shot LLM call with a strict JSON output contract.

Returns
-------
{"is_relevant": bool, "intent": "task_query" | "project_query" | "count_query" | "unrelated",
 "is_personal": bool}
"""

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage

from app.client.llms import get_llm, parse_llm_json

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "classifier.txt"


class ClassifyResult(TypedDict):
    is_relevant: bool
    intent: str
    is_personal: bool


# Cache the prompt file so disk I/O happens only once per process.
@lru_cache(maxsize=1)
def _load_prompt() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


def classify(query: str) -> ClassifyResult:
    """
    Classify whether the query relates to task/project management.

    Args:
        query: Raw user input.

    Returns:
        ClassifyResult with is_relevant and intent fields.
        Falls back to {"is_relevant": False, "intent": "unrelated"} on parse failure.
    """
    logger.info("[classifier] query=%r", query)

    messages = [
        SystemMessage(content=_load_prompt()),
        HumanMessage(content=query),
    ]

    content = get_llm().invoke(messages).content
    raw = _coerce_content_to_text(content)

    try:
        result: dict = parse_llm_json(raw)
        if "is_relevant" not in result or "intent" not in result:
            raise ValueError("missing required keys")
    except (json.JSONDecodeError, ValueError):
        logger.warning("[classifier] unparseable LLM output=%r — defaulting to unrelated", raw)
        result = {"is_relevant": False, "intent": "unrelated", "is_personal": False}

    logger.info("[classifier] result=%s", result)
    return ClassifyResult(
        is_relevant=bool(result["is_relevant"]),
        intent=str(result["intent"]),
        is_personal=bool(result.get("is_personal", False)),
    )


def _coerce_content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(str(item) for item in content)
    return str(content)
