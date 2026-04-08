"""
Generator — produces a grounded answer by combining LLM reasoning with context documents.

The system prompt (answer.txt) enforces the RAG contract:
  - answer ONLY from provided context
  - return the fallback phrase when context is insufficient
    - answer with a warm, helpful, slightly more detailed style

Context is formatted into labelled blocks (one per document) and injected into
the prompt via the {context} placeholder. A character budget (~1500 tokens) is
enforced before the prompt is sent to the LLM.
"""

import logging
from functools import lru_cache
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage

from app.chatbot.components import Document
from app.common.llm import get_llm

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "answer.txt"

# ~1500 tokens budget (using the conservative estimate of 4 chars per token)
_MAX_CONTEXT_CHARS = 6_000

FALLBACK = "Không đủ dữ liệu"


@lru_cache(maxsize=1)
def _load_prompt_template() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


# ── Document formatters ───────────────────────────────────────────────────────

def _format_task(source: dict) -> str:
    """Render a task _source dict as a labelled, human-readable block."""
    assignees = source.get("assignees") or []
    assignee_names = ", ".join(a.get("fullName", "") for a in assignees) or "N/A"
    relation = source.get("relation") or {}
    workspace = relation.get("workspace") or {}
    project = relation.get("project") or {}
    sprint = relation.get("sprint") or {}

    lines = [
        f"[Task] {source.get('title', 'Untitled')}",
        f"  Workspace: {workspace.get('name', source.get('workspaceName', 'N/A'))}",
        f"  Project  : {project.get('name', source.get('projectName', 'N/A'))}",
        f"  Status   : {source.get('status', 'N/A')}",
        f"  Priority : {source.get('priority', 'N/A')}",
        f"  Assignees: {assignee_names}",
        f"  Due date : {source.get('dueDate', 'N/A')}",
        f"  Sprint   : {sprint.get('name', source.get('sprintName', 'N/A'))}",
    ]
    tags = [t.get("name", "") for t in (source.get("tags") or []) if t.get("name")]
    if tags:
        lines.append(f"  Tags     : {', '.join(tags)}")
    if source.get("description"):
        lines.append(f"  Desc     : {source['description'][:200]}")
    lines.append(
        "  Relation : workspace -> project -> task"
    )
    return "\n".join(lines)


def _format_count(source: dict) -> str:
    """Render an aggregation count result as a readable block."""
    lines = [
        f"[Count Result]",
        f"  Total tasks: {source.get('count', 0)}",
    ]
    if source.get("context"):
        lines.append(f"  For query  : {source['context']}")
    return "\n".join(lines)


def _format_project(source: dict) -> str:
    """Render a project _source dict as a labelled, human-readable block."""
    relation = source.get("relation") or {}
    workspace = relation.get("workspace") or {}
    lines = [
        f"[Project] {source.get('name', 'Untitled')}",
        f"  Workspace: {workspace.get('name', source.get('workspaceName', 'N/A'))}",
        f"  Status   : {source.get('status', 'N/A')}",
        f"  Start    : {source.get('startDate', 'N/A')}",
        f"  End      : {source.get('endDate', 'N/A')}",
        f"  Tasks    : total={source.get('totalTasks', 0)} todo={source.get('todoTasks', 0)} "
        f"in_progress={source.get('inProgressTasks', 0)} review={source.get('reviewTasks', 0)} "
        f"done={source.get('doneTasks', 0)}",
    ]
    members = [m.get("fullName", "") for m in (source.get("members") or []) if m.get("fullName")]
    if members:
        lines.append(f"  Members  : {', '.join(members)}")
    if source.get("description"):
        lines.append(f"  Desc     : {source['description'][:200]}")
    lines.append("  Relation : workspace -> project")
    return "\n".join(lines)


def _build_context(docs: list[Document]) -> str:
    """
    Serialise context documents into a single string, respecting the token budget.

    Documents are processed in score order (highest first, as provided by filter_docs).
    Processing stops as soon as the next block would exceed _MAX_CONTEXT_CHARS.
    """
    blocks: list[str] = []
    total = 0

    for doc in docs:
        if doc["index"] == "tasks":
            block = _format_task(doc["source"])
        elif doc["index"] == "count_result":
            block = _format_count(doc["source"])
        else:
            block = _format_project(doc["source"])

        if total + len(block) > _MAX_CONTEXT_CHARS:
            logger.warning(
                "[generator] context budget reached at %d chars — stopping after %d docs",
                total, len(blocks),
            )
            break

        blocks.append(block)
        total += len(block)

    return "\n\n".join(blocks)


# ── Public API ────────────────────────────────────────────────────────────────

def generate(query: str, docs: list[Document]) -> str:
    """
    Generate a grounded answer for the user query using the provided context.

    Args:
        query: Original user question.
        docs:  Filtered context documents (output of filter_docs).

    Returns:
        LLM-generated answer string, or FALLBACK when docs is empty.
    """
    if not docs:
        logger.warning("[generator] no context docs — returning fallback")
        return FALLBACK

    context = _build_context(docs)
    logger.info("[generator] context_chars=%d doc_count=%d\n%s", len(context), len(docs), context)

    system_prompt = _load_prompt_template().replace("{context}", context)

    response = get_llm().invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=query),
    ])

    answer = response.content.strip()
    logger.info("[generator] answer=%r", answer)
    return answer
