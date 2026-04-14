"""Action agent orchestrator that plans and delegates commands to MCP."""

from __future__ import annotations

import json
import logging
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
    "create_project_from_workflow",
    "update_task_status",
    "create_project",
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


def _plan_action(query: str) -> dict[str, Any]:
    content = get_llm().invoke(
        [
            SystemMessage(content=_load_prompt()),
            HumanMessage(content=query),
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
    }


def run_action_agent(query: str, user_id: int, mcp_client: SpringBootMcpClient | None = None) -> AgentActionResult:
    """Plan an executable action and delegate it to the Spring Boot MCP server."""
    plan = _plan_action(query)
    if not plan["should_execute"]:
        return AgentActionResult(
            executed=False,
            action="none",
            message=plan.get("reason", "not an execution request"),
            payload=None,
        )

    client = mcp_client or SpringBootMcpClient()
    try:
        payload = client.execute(
            action=plan["action"],
            arguments=plan["arguments"],
            user_id=user_id,
        )
        return AgentActionResult(
            executed=True,
            action=plan["action"],
            message="action executed via MCP",
            payload=payload,
        )
    except Exception as exc:
        logger.warning("[action-agent] MCP execution failed action=%s err=%s", plan["action"], exc)
        return AgentActionResult(
            executed=False,
            action=plan["action"],
            message=f"mcp execution failed: {exc}",
            payload=None,
        )
