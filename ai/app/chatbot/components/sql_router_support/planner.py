"""LLM-backed SQL template planning."""

from __future__ import annotations

import json
import logging
from collections.abc import Callable
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.chatbot.components.sql_router_support.coercion import coerce_limit, coerce_project_name_like, coerce_status
from app.chatbot.components.sql_router_support.types import ALLOWED_QUERY_IDS, SqlPlan
from app.client.llms import parse_llm_json

logger = logging.getLogger(__name__)


def build_plan(
    query: str,
    intent: str,
    is_personal: bool,
    requested_limit: int | None,
    project_id: int | None,
    *,
    prompt: str,
    get_llm: Callable[[], Any],
) -> SqlPlan | None:
    llm_input = {
        "query": query,
        "intent": intent,
        "is_personal": is_personal,
        "requested_limit": requested_limit,
        "project_id": project_id,
    }
    content = get_llm().invoke([
        SystemMessage(content=prompt),
        HumanMessage(content=json.dumps(llm_input, ensure_ascii=False)),
    ]).content

    raw = str(content)
    try:
        parsed = parse_llm_json(raw)
    except (json.JSONDecodeError, ValueError):
        logger.warning("[sql-router] invalid planner output=%r", raw)
        return None

    if not isinstance(parsed, dict):
        return None

    query_id = str(parsed.get("query_id", "")).strip()
    if query_id not in ALLOWED_QUERY_IDS:
        logger.warning("[sql-router] unknown query_id=%r", query_id)
        return None

    params_any = parsed.get("params", {})
    params = params_any if isinstance(params_any, dict) else {}
    limit = coerce_limit(params.get("limit", requested_limit or 20), default=requested_limit or 20)

    return SqlPlan(
        query_id=query_id,
        params={
            "limit": limit,
            "status": coerce_status(params.get("status")),
            "project_id": int(params["project_id"]) if isinstance(params.get("project_id"), int) else None,
            "project_name_like": coerce_project_name_like(params.get("project_name_like")),
        },
    )
