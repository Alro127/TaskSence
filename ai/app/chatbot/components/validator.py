"""
Validator — verifies that the generated answer is grounded in the retrieved context.

The LLM is asked to perform a strict fact-check: every claim in the answer must be
traceable to the provided context. Recognised fallback phrases (e.g. "Không đủ dữ liệu")
are automatically treated as grounded without an LLM call.

Returns True if the answer is supported; False if it contains unsupported claims.
"""

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.chatbot.components import Document
from app.client.llms  import get_llm, parse_llm_json

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "validate.txt"

# Recognised fallback phrases that are always considered grounded.
_FALLBACK_PREFIXES = ("Không đủ dữ liệu", "Không tìm thấy", "Chỉ hỗ trợ", "Hệ thống AI")


@lru_cache(maxsize=1)
def _load_prompt() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


def _is_fallback(answer: str) -> bool:
    """Return True if the answer is one of the pipeline's own fallback phrases."""
    stripped = answer.strip()
    return any(stripped.startswith(prefix) for prefix in _FALLBACK_PREFIXES)


def _flatten_context(docs: list[Document]) -> str:
    """Serialise context documents to a compact, fact-checkable text format."""
    lines: list[str] = []
    for doc in docs:
        src = doc["source"]
        if doc["index"] == "tasks":
            lines.append(
                f"Task: {src.get('title')} | status={src.get('status')} "
                f"| priority={src.get('priority')} | due={src.get('dueDate')} "
                f"| project={src.get('projectName')}"
            )
        else:
            lines.append(
                f"Project: {src.get('name')} | status={src.get('status')} "
                f"| end={src.get('endDate')} | workspace={src.get('workspaceName')}"
            )
    return "\n".join(lines)


def validate(answer: str, docs: list[Document]) -> bool:
    """
    Check whether the answer is fully supported by the context documents.

    Args:
        answer: Generated answer from the generator component.
        docs:   Context documents used during generation.

    Returns:
        True  — every claim in the answer is verifiable in the context.
        False — the answer contains information not present in the context.
    """
    logger.info("[validator] answer=%r doc_count=%d", answer, len(docs))

    # Fallback phrases are always grounded — no LLM call needed.
    if _is_fallback(answer):
        logger.info("[validator] recognized fallback phrase — skipping LLM check")
        return True

    if not docs:
        logger.warning("[validator] no context docs and non-fallback answer — rejecting")
        return False

    context_text = _flatten_context(docs)

    content = get_llm().invoke([
        SystemMessage(content=_load_prompt()),
        HumanMessage(content=f"Answer:\n{answer}\n\nContext:\n{context_text}"),
    ]).content
    raw = _coerce_content_to_text(content)

    try:
        result: dict = parse_llm_json(raw)
        is_grounded = bool(result.get("is_grounded", False))
    except (json.JSONDecodeError, KeyError):
        logger.warning("[validator] unparseable LLM output=%r — defaulting to False", raw)
        is_grounded = False

    logger.info("[validator] is_grounded=%s", is_grounded)
    return is_grounded


def _coerce_content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(str(item) for item in content)
    return str(content)
