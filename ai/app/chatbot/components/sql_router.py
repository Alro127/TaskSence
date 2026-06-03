"""Template-based PostgreSQL query router for chatbot retrieval."""

from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.chatbot.components import Document
from app.chatbot.components.sql_router_support.coercion import coerce_limit as _coerce_limit
from app.chatbot.components.sql_router_support.planner import build_plan
from app.chatbot.components.sql_router_support.queries import (
    _query_my_tasks,
    _query_related_projects,
    _query_tasks_by_project_id,
    _query_tasks_by_project_name,
)
from app.chatbot.components.sql_router_support.types import SqlPlan
from app.client.llms import get_llm

logger = logging.getLogger(__name__)
_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "sql_query_planner.txt"


@lru_cache(maxsize=1)
def _load_prompt() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


def _build_plan(
    query: str,
    intent: str,
    is_personal: bool,
    requested_limit: int | None,
    project_id: int | None,
) -> SqlPlan | None:
    return build_plan(
        query=query,
        intent=intent,
        is_personal=is_personal,
        requested_limit=requested_limit,
        project_id=project_id,
        prompt=_load_prompt(),
        get_llm=get_llm,
    )


def query_postgres_documents(
    query: str,
    user_id: int,
    intent: str,
    is_personal: bool,
    requested_limit: int | None,
    project_id: int | None,
) -> list[Document]:
    """Plan and execute a safe predefined SQL template for chatbot context."""
    try:
        plan = _build_plan(query, intent, is_personal, requested_limit, project_id)
        if plan is None:
            return []

        query_id = plan["query_id"]
        params: dict[str, Any] = plan["params"]
        if project_id is not None and params.get("project_id") is None:
            params["project_id"] = project_id

        logger.info("[sql-router] selected query_id=%s params=%s", query_id, params)

        if query_id == "my_tasks_list":
            return _query_my_tasks(user_id=user_id, params=params, overdue_only=False)
        if query_id == "overdue_my_tasks":
            return _query_my_tasks(user_id=user_id, params=params, overdue_only=True)
        if query_id == "tasks_by_project_id":
            resolved_project_id = params.get("project_id")
            if not isinstance(resolved_project_id, int):
                return []
            return _query_tasks_by_project_id(user_id, resolved_project_id, _coerce_limit(params.get("limit"), requested_limit or 20))
        if query_id == "tasks_by_project_name_like":
            project_name_like = params.get("project_name_like")
            if not isinstance(project_name_like, str) or not project_name_like.strip():
                return []
            return _query_tasks_by_project_name(user_id, project_name_like.strip(), _coerce_limit(params.get("limit"), requested_limit or 20))
        if query_id == "related_projects":
            return _query_related_projects(user_id, _coerce_limit(params.get("limit"), requested_limit or 20))
        return []
    except Exception as exc:
        logger.warning("[sql-router] query failed: %s", exc)
        return []
