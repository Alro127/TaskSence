"""Action agent orchestrator that plans and delegates commands to MCP."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.agent.mcp_client import SpringBootMcpClient
from app.client.llms import get_llm, parse_llm_json

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).parent.parent / "chatbot" / "prompts" / "agent_action_planner.txt"
_ALLOWED_ACTIONS = {
    "none",
    "create_task",
    "create_workspace",
    "create_workflow_from_project",
    "update_task_status",
    "create_project",
    "create_project_with_tasks",
    "update_task",
    "delete_task",
    "delete_project",
}

_REQUIRED_ARGUMENTS = {
    "create_task": {"title"},
    "create_project": {"name"},
    "create_workspace": {"name"},
    "update_task_status": {"status"},
    "create_workflow_from_project": set(),
    "create_project_with_tasks": {"name"},
    "update_task": set(),
    "delete_task": set(),
    "delete_project": set(),
}

_NATURAL_ACTIONS = {
    "create_task": "create_task_natural",
    "create_project": "create_project_natural",
    "create_workflow_from_project": "create_workflow_from_project_natural",
    "update_task": "update_task_natural",
    "delete_task": "delete_task_natural",
    "delete_project": "delete_project_natural",
}


@dataclass(frozen=True)
class AgentActionResult:
    executed: bool
    action: str
    message: str
    payload: dict[str, Any] | None = None


@lru_cache(maxsize=1)
def _load_prompt() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


def _plan_action(query: str, conversation_history: str = "") -> dict[str, Any]:
    user_payload = query
    if conversation_history.strip():
        user_payload = f"Chat history:\n{conversation_history.strip()}\n\nCurrent user request:\n{query}"

    content = get_llm().invoke(
        [
            SystemMessage(content=_load_prompt()),
            HumanMessage(content=user_payload),
        ]
    ).content

    raw = str(content)
    try:
        planned = parse_llm_json(raw)
    except (json.JSONDecodeError, ValueError):
        logger.warning("[action-agent] planner output invalid: %r", raw)
        return {
            "should_execute": False,
            "action": "none",
            "reason": "planner output invalid",
            "arguments": {},
        }

    if not isinstance(planned, dict):
        return {
            "should_execute": False,
            "action": "none",
            "reason": "planner output not object",
            "arguments": {},
        }

    action = str(planned.get("action", "none"))
    if action not in _ALLOWED_ACTIONS:
        action = "none"

    arguments = planned.get("arguments", {})
    if not isinstance(arguments, dict):
        arguments = {}

    return {
        "should_execute": bool(planned.get("should_execute", False)) and action != "none",
        "action": action,
        "reason": str(planned.get("reason", "")),
        "arguments": arguments,
        "reasoning": _normalize_reasoning(planned.get("reasoning"), planned.get("reason", "")),
    }


def _normalize_reasoning(value: Any, fallback_reason: Any) -> list[str]:
    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        if cleaned:
            return cleaned[:6]
    fallback = str(fallback_reason).strip()
    return [fallback] if fallback else []


def _missing_required_arguments(action: str, arguments: dict[str, Any]) -> list[str]:
    required = _REQUIRED_ARGUMENTS.get(action, set())
    missing = []
    for field in sorted(required):
        value = arguments.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            missing.append(field)
    return missing


def _tool_name_for_action(action: str) -> str:
    return _NATURAL_ACTIONS.get(action, action)


def _augment_arguments(action: str, arguments: dict[str, Any], query: str, user_id: int) -> dict[str, Any]:
    augmented = dict(arguments)
    if action == "create_task" and "assigneeIds" not in augmented and _mentions_self_assignment(query):
        augmented["assigneeIds"] = [user_id]
    return augmented


def _mentions_self_assignment(query: str) -> bool:
    normalized = query.lower()
    patterns = [
        r"\bassign\s+me\b",
        r"\bassign\s+to\s+me\b",
        r"\bgan\s+(toi|minh)\b",
        r"\bdinh\s+(toi|minh)\b",
        r"\bcho\s+(toi|minh)\b",
    ]
    return any(re.search(pattern, normalized) for pattern in patterns)


def _is_resolution_payload(payload: Any) -> bool:
    if not isinstance(payload, dict):
        return False
    result = payload.get("data", {}).get("result") if isinstance(payload.get("data"), dict) else None
    return isinstance(result, dict) and str(result.get("status", "")).upper() in {
        "AMBIGUOUS",
        "NOT_FOUND",
        "FORBIDDEN",
        "CONFIRMATION_REQUIRED",
    }


def _resolution_message(payload: dict[str, Any], action: str) -> str:
    result = payload.get("data", {}).get("result") if isinstance(payload.get("data"), dict) else None
    if not isinstance(result, dict):
        return "Can ban bo sung them thong tin de minh thuc thi chinh xac."
    status = str(result.get("status", "")).upper()
    if status == "CONFIRMATION_REQUIRED":
        message = str(result.get("message") or f"Can ban xac nhan truoc khi thuc hien {action}.")
        expires_at = result.get("expiresAt")
        if expires_at:
            message += f" Het han luc {expires_at}."
        return message
    candidates = result.get("candidates")
    if status == "AMBIGUOUS" and isinstance(candidates, list) and candidates:
        labels = []
        for item in candidates[:5]:
            if not isinstance(item, dict):
                continue
            name = item.get("projectName") or item.get("workspaceName") or item.get("name")
            workspace = item.get("workspaceName")
            if name and workspace:
                labels.append(f"{name} / {workspace}")
            elif name:
                labels.append(str(name))
        if labels:
            return "Minh tim thay nhieu noi phu hop cho hanh dong " + action + ": " + "; ".join(labels) + ". Ban muon dung cai nao?"
    return str(result.get("message") or "Khong tim thay workspace/project duoc phep truy cap. Ban hay noi ro ten workspace/project.")


def run_action_agent(
    query: str,
    user_id: int,
    mcp_client: SpringBootMcpClient | None = None,
    auth_token: str | None = None,
    conversation_history: str = "",
) -> AgentActionResult:
    """Plan an executable action and delegate it to the Spring Boot MCP server."""
    plan = _plan_action(query, conversation_history)
    if not plan["should_execute"]:
        return AgentActionResult(
            executed=False,
            action="none",
            message=plan.get("reason", "not an execution request"),
            payload={"reasoning": plan.get("reasoning", [])},
        )

    client = mcp_client or SpringBootMcpClient()
    plan["arguments"] = _augment_arguments(plan["action"], plan["arguments"], query, user_id)
    missing_fields = _missing_required_arguments(plan["action"], plan["arguments"])
    if missing_fields:
        return AgentActionResult(
            executed=False,
            action=plan["action"],
            message=(
                "missing required fields for "
                f"{plan['action']}: {', '.join(missing_fields)}. "
                "Vui long bo sung cac thong tin nay truoc khi minh thuc thi."
            ),
            payload={
                "missingFields": missing_fields,
                "plannedArguments": plan["arguments"],
                "reasoning": plan.get("reasoning", []),
            },
        )

    try:
        tool_name = _tool_name_for_action(plan["action"])
        payload = client.execute_with_token(
            action=tool_name,
            arguments=plan["arguments"],
            user_id=user_id,
            auth_token=auth_token,
        )
        if _is_resolution_payload(payload):
            return AgentActionResult(
                executed=False,
                action=plan["action"],
                message=_resolution_message(payload, plan["action"]),
                payload={"mcp": payload, "reasoning": plan.get("reasoning", [])},
            )
        return AgentActionResult(
            executed=True,
            action=plan["action"],
            message="action executed via MCP",
            payload={"mcp": payload, "reasoning": plan.get("reasoning", [])},
        )
    except Exception as exc:
        logger.warning("[action-agent] MCP execution failed action=%s err=%s", plan["action"], exc)
        return AgentActionResult(
            executed=False,
            action=plan["action"],
            message=f"mcp execution failed: {exc}",
            payload=None,
        )
