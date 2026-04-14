"""Template-based PostgreSQL query router for chatbot retrieval.

This component lets the LLM choose from predefined SQL templates, then executes
parameterized read-only queries to provide precise context documents.
"""

from __future__ import annotations

import json
import logging
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Any, TypedDict, cast

from langchain_core.messages import HumanMessage, SystemMessage

from app.chatbot.components import Document
from app.client.llms import get_llm, parse_llm_json
from app.config.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "sql_query_planner.txt"
_ALLOWED_QUERY_IDS = {
    "my_tasks_list",
    "overdue_my_tasks",
    "tasks_by_project_id",
    "tasks_by_project_name_like",
    "related_projects",
}


class SqlPlan(TypedDict):
    query_id: str
    params: dict[str, Any]


@lru_cache(maxsize=1)
def _load_prompt() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


def _connect():
    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError as exc:  # pragma: no cover - runtime dependency
        raise RuntimeError("psycopg is required for SQL router") from exc

    return psycopg.connect(
        settings.effective_postgres_dsn,
        row_factory=cast(Any, dict_row),
    )


def _as_dict_rows(rows: Any) -> list[dict[str, Any]]:
    return [cast(dict[str, Any], row) for row in rows]


def _to_point_id(collection: str, entity_id: int) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"tasksense/{collection}/{entity_id}"))


def _coerce_status(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip().upper()
    if normalized in {"TODO", "IN_PROGRESS", "REVIEW", "DONE"}:
        return normalized
    return None


def _coerce_project_name_like(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    return cleaned[:120]


def _coerce_limit(value: Any, default: int = 20) -> int:
    try:
        numeric = int(value)
    except (TypeError, ValueError):
        return default
    return max(1, min(100, numeric))


def _build_plan(
    query: str,
    intent: str,
    is_personal: bool,
    requested_limit: int | None,
    project_id: int | None,
) -> SqlPlan | None:
    llm_input = {
        "query": query,
        "intent": intent,
        "is_personal": is_personal,
        "requested_limit": requested_limit,
        "project_id": project_id,
    }

    content = get_llm().invoke(
        [
            SystemMessage(content=_load_prompt()),
            HumanMessage(content=json.dumps(llm_input, ensure_ascii=False)),
        ]
    ).content

    raw = str(content)
    try:
        parsed = parse_llm_json(raw)
    except (json.JSONDecodeError, ValueError):
        logger.warning("[sql-router] invalid planner output=%r", raw)
        return None

    if not isinstance(parsed, dict):
        return None

    query_id = str(parsed.get("query_id", "")).strip()
    if query_id not in _ALLOWED_QUERY_IDS:
        logger.warning("[sql-router] unknown query_id=%r", query_id)
        return None

    params_any = parsed.get("params", {})
    params = params_any if isinstance(params_any, dict) else {}
    limit = _coerce_limit(params.get("limit", requested_limit or 20), default=requested_limit or 20)

    return SqlPlan(
        query_id=query_id,
        params={
            "limit": limit,
            "status": _coerce_status(params.get("status")),
            "project_id": int(params["project_id"]) if isinstance(params.get("project_id"), int) else None,
            "project_name_like": _coerce_project_name_like(params.get("project_name_like")),
        },
    )


def _task_source(row: dict[str, Any]) -> dict[str, Any]:
    due_date = row.get("dueDate")
    return {
        "entityId": row["entityId"],
        "title": row.get("title"),
        "description": row.get("description"),
        "status": row.get("status"),
        "priority": row.get("priority"),
        "projectId": row.get("projectId"),
        "projectName": row.get("projectName"),
        "workspaceId": row.get("workspaceId"),
        "workspaceName": row.get("workspaceName"),
        "sprintId": row.get("sprintId"),
        "sprintName": row.get("sprintName"),
        "dueDate": due_date.isoformat() if due_date else None,
        "createdById": row.get("createdById"),
        "createdByName": row.get("createdByName"),
        "assignees": row.get("assignees") or [],
        "relation": {
            "workspace": {"id": row.get("workspaceId"), "name": row.get("workspaceName")},
            "project": {"id": row.get("projectId"), "name": row.get("projectName")},
            "sprint": {"id": row.get("sprintId"), "name": row.get("sprintName")},
        },
    }


def _project_source(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "entityId": row["entityId"],
        "name": row.get("name"),
        "description": row.get("description"),
        "status": row.get("status"),
        "workspaceId": row.get("workspaceId"),
        "workspaceName": row.get("workspaceName"),
        "members": row.get("members") or [],
        "relation": {
            "workspace": {"id": row.get("workspaceId"), "name": row.get("workspaceName")}
        },
    }


def _execute_task_query(sql: str, params: dict[str, Any]) -> list[Document]:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(cast(Any, sql), params)
            rows = _as_dict_rows(cur.fetchall())

    docs: list[Document] = []
    for rank, row in enumerate(rows):
        entity_id = int(row["entityId"])
        docs.append(
            Document(
                id=_to_point_id(settings.qdrant_collection_tasks, entity_id),
                index=settings.qdrant_collection_tasks,
                score=1.0 - (rank * 0.001),
                source=_task_source(row),
            )
        )
    return docs


def _execute_project_query(sql: str, params: dict[str, Any]) -> list[Document]:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(cast(Any, sql), params)
            rows = _as_dict_rows(cur.fetchall())

    docs: list[Document] = []
    for rank, row in enumerate(rows):
        entity_id = int(row["entityId"])
        docs.append(
            Document(
                id=_to_point_id(settings.qdrant_collection_projects, entity_id),
                index=settings.qdrant_collection_projects,
                score=1.0 - (rank * 0.001),
                source=_project_source(row),
            )
        )
    return docs


def _query_my_tasks(user_id: int, params: dict[str, Any], overdue_only: bool = False) -> list[Document]:
    sql = """
        SELECT
            t.id AS "entityId",
            t.title,
            t.description,
            t.status::text AS status,
            t.priority::text AS priority,
            t.project_id AS "projectId",
            p.name AS "projectName",
            p.workspace_id AS "workspaceId",
            w.name AS "workspaceName",
            s.id AS "sprintId",
            s.name AS "sprintName",
            t.due_date AS "dueDate",
            t.created_by AS "createdById",
            creator.full_name AS "createdByName",
            (
                SELECT COALESCE(
                    json_agg(jsonb_build_object('id', u2.id, 'fullName', u2.full_name)),
                    '[]'::json
                )
                FROM task_assignees ta2
                JOIN users u2 ON u2.id = ta2.user_id
                WHERE ta2.task_id = t.id
            ) AS assignees
        FROM tasks t
        JOIN projects p ON p.id = t.project_id AND p.deleted_at IS NULL
        JOIN workspaces w ON w.id = p.workspace_id AND w.deleted_at IS NULL
        LEFT JOIN sprints s ON s.id = t.sprint_id AND s.deleted_at IS NULL
        LEFT JOIN users creator ON creator.id = t.created_by
        WHERE t.deleted_at IS NULL
          AND (
              t.created_by = %(user_id)s
              OR EXISTS (
                  SELECT 1
                  FROM task_assignees ta
                  WHERE ta.task_id = t.id AND ta.user_id = %(user_id)s
              )
          )
          AND (%(status)s::text IS NULL OR t.status::text = %(status)s::text)
          AND (
              %(project_id)s::bigint IS NULL
              OR t.project_id = %(project_id)s::bigint
          )
          AND (
              %(project_name_like)s::text IS NULL
              OR LOWER(p.name) LIKE LOWER(%(project_name_pattern)s::text)
          )
    """
    if overdue_only:
        sql += "\n          AND t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE AND t.status::text <> 'DONE'\n"

    sql += """
        ORDER BY
            t.due_date IS NULL ASC,
            t.due_date ASC,
            t.updated_at DESC
        LIMIT %(limit)s
    """

    query_params = {
        "user_id": user_id,
        "status": params.get("status"),
        "project_id": params.get("project_id"),
        "project_name_like": params.get("project_name_like"),
        "project_name_pattern": f"%{params.get('project_name_like')}%" if params.get("project_name_like") else None,
        "limit": params.get("limit", 20),
    }

    return _execute_task_query(sql, query_params)


def _query_tasks_by_project_id(user_id: int, project_id: int, limit: int) -> list[Document]:
    return _query_my_tasks(
        user_id=user_id,
        params={
            "project_id": project_id,
            "limit": limit,
            "status": None,
            "project_name_like": None,
        },
    )


def _query_tasks_by_project_name(user_id: int, project_name_like: str, limit: int) -> list[Document]:
    return _query_my_tasks(
        user_id=user_id,
        params={
            "project_id": None,
            "limit": limit,
            "status": None,
            "project_name_like": project_name_like,
        },
    )


def _query_related_projects(user_id: int, limit: int) -> list[Document]:
    sql = """
        SELECT
            p.id AS "entityId",
            p.name,
            p.description,
            p.status::text AS status,
            p.workspace_id AS "workspaceId",
            w.name AS "workspaceName",
            (
                SELECT COALESCE(
                    json_agg(jsonb_build_object('id', u2.id, 'fullName', u2.full_name)),
                    '[]'::json
                )
                FROM project_members pm2
                JOIN users u2 ON u2.id = pm2.user_id
                WHERE pm2.project_id = p.id AND pm2.deleted_at IS NULL
            ) AS members
        FROM projects p
        JOIN workspaces w ON w.id = p.workspace_id AND w.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND (
              EXISTS (
                  SELECT 1 FROM project_members pm
                  WHERE pm.project_id = p.id
                    AND pm.user_id = %(user_id)s
                    AND pm.deleted_at IS NULL
              )
              OR EXISTS (
                  SELECT 1 FROM workspace_members wm
                  WHERE wm.workspace_id = p.workspace_id
                    AND wm.user_id = %(user_id)s
                    AND wm.deleted_at IS NULL
              )
          )
        ORDER BY p.updated_at DESC
        LIMIT %(limit)s
    """

    return _execute_project_query(sql, {"user_id": user_id, "limit": limit})


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
        plan = _build_plan(
            query=query,
            intent=intent,
            is_personal=is_personal,
            requested_limit=requested_limit,
            project_id=project_id,
        )
        if plan is None:
            return []

        query_id = plan["query_id"]
        params = plan["params"]

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
            return _query_tasks_by_project_id(
                user_id=user_id,
                project_id=resolved_project_id,
                limit=_coerce_limit(params.get("limit", requested_limit or 20)),
            )

        if query_id == "tasks_by_project_name_like":
            project_name_like = params.get("project_name_like")
            if not isinstance(project_name_like, str) or not project_name_like.strip():
                return []
            return _query_tasks_by_project_name(
                user_id=user_id,
                project_name_like=project_name_like.strip(),
                limit=_coerce_limit(params.get("limit", requested_limit or 20)),
            )

        if query_id == "related_projects":
            return _query_related_projects(
                user_id=user_id,
                limit=_coerce_limit(params.get("limit", requested_limit or 20)),
            )

        return []
    except Exception as exc:
        logger.warning("[sql-router] query failed: %s", exc)
        return []
