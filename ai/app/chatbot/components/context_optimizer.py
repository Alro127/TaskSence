"""Utilities for compact, budgeted RAG context assembly."""

from __future__ import annotations

import logging
from typing import Iterable

from app.chatbot.components import Document
from app.config.config import get_settings

logger = logging.getLogger(__name__)


def clamp_requested_limit(value: int | None, *, default: int, maximum: int = 100) -> int:
    """Normalize LLM/user limits so retrieval and prompts stay bounded."""
    if value is None:
        return default
    try:
        numeric = int(value)
    except (TypeError, ValueError):
        return default
    return max(1, min(maximum, numeric))


def retrieval_limit(requested_limit: int | None, *, intent: str) -> int:
    """Return a modest candidate pool; filter/rerank will choose final context docs."""
    settings = get_settings()
    base = clamp_requested_limit(requested_limit, default=settings.chatbot_retrieval_top_k)
    if intent in ("list_query", "count_query"):
        return min(100, max(base, settings.chatbot_max_context_docs_for_list * 2))
    return min(50, max(base, settings.chatbot_max_context_docs * 3))


def trim_text(value: object, limit: int) -> str:
    """Collapse whitespace and cut long text at a word boundary when possible."""
    text = " ".join(str(value or "").split())
    if len(text) <= limit:
        return text
    clipped = text[:limit].rsplit(" ", 1)[0].strip()
    return f"{clipped}..." if clipped else text[:limit]


def trim_history(history: str) -> str:
    """Keep the most recent conversation turns because they carry follow-up intent."""
    settings = get_settings()
    budget = max(0, settings.chatbot_history_char_budget)
    if not history:
        return "(no previous messages)"
    if len(history) <= budget:
        return history
    return "...\n" + history[-budget:]


def build_context(docs: list[Document]) -> str:
    """Serialize docs into dense, metadata-aware blocks within the configured budget."""
    settings = get_settings()
    return "\n".join(_budgeted_blocks((_format_doc(doc) for doc in docs), settings.chatbot_context_char_budget))


def _budgeted_blocks(blocks: Iterable[str], budget: int) -> list[str]:
    selected: list[str] = []
    total = 0
    for block in blocks:
        next_size = len(block) + (1 if selected else 0)
        if total + next_size > budget:
            logger.info("[context-optimizer] context budget reached chars=%d blocks=%d", total, len(selected))
            break
        selected.append(block)
        total += next_size
    return selected


def _format_doc(doc: Document) -> str:
    source = doc.get("source", {})
    index = str(doc.get("index", ""))
    if index == "count_result":
        return f"COUNT total={source.get('count', 0)} query={trim_text(source.get('context'), 100)}"
    if "task" in index:
        return _format_task(source)
    return _format_project(source)


def _format_task(source: dict) -> str:
    relation = source.get("relation") or {}
    workspace = relation.get("workspace") or {}
    project = relation.get("project") or {}
    sprint = relation.get("sprint") or {}
    assignees = ", ".join(a.get("fullName", "") for a in source.get("assignees") or [] if a.get("fullName")) or "N/A"
    parts = [
        "TASK",
        f"id={source.get('entityId', 'N/A')}",
        f"title={trim_text(source.get('title', 'Untitled'), 90)}",
        f"status={source.get('status', 'N/A')}",
        f"priority={source.get('priority', 'N/A')}",
        f"assignees={assignees}",
        f"due={source.get('dueDate', 'N/A')}",
        f"workspace={workspace.get('name', source.get('workspaceName', 'N/A'))}",
        f"project={project.get('name', source.get('projectName', 'N/A'))}",
        f"sprint={sprint.get('name', source.get('sprintName', 'N/A'))}",
    ]
    if source.get("description"):
        parts.append(f"desc={trim_text(source['description'], 140)}")
    return " | ".join(parts)


def _format_project(source: dict) -> str:
    relation = source.get("relation") or {}
    workspace = relation.get("workspace") or {}
    members = ", ".join(m.get("fullName", "") for m in source.get("members") or [] if m.get("fullName"))
    parts = [
        "PROJECT",
        f"id={source.get('entityId', 'N/A')}",
        f"name={trim_text(source.get('name', 'Untitled'), 90)}",
        f"status={source.get('status', 'N/A')}",
        f"workspace={workspace.get('name', source.get('workspaceName', 'N/A'))}",
    ]
    if members:
        parts.append(f"members={trim_text(members, 160)}")
    if source.get("description"):
        parts.append(f"desc={trim_text(source['description'], 140)}")
    return " | ".join(parts)
