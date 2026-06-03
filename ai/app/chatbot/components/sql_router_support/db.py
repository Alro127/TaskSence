"""Database and document helpers for SQL router."""

from __future__ import annotations

import uuid
from typing import Any, cast

from app.chatbot.components import Document
from app.config.config import get_settings

settings = get_settings()


def connect():
    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError as exc:  # pragma: no cover - runtime dependency
        raise RuntimeError("psycopg is required for SQL router") from exc

    return psycopg.connect(
        settings.effective_postgres_dsn,
        row_factory=cast(Any, dict_row),
    )


def as_dict_rows(rows: Any) -> list[dict[str, Any]]:
    return [cast(dict[str, Any], row) for row in rows]


def to_point_id(collection: str, entity_id: int) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"tasksense/{collection}/{entity_id}"))


def task_source(row: dict[str, Any]) -> dict[str, Any]:
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


def project_source(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "entityId": row["entityId"],
        "name": row.get("name"),
        "description": row.get("description"),
        "status": row.get("status"),
        "workspaceId": row.get("workspaceId"),
        "workspaceName": row.get("workspaceName"),
        "members": row.get("members") or [],
        "relation": {"workspace": {"id": row.get("workspaceId"), "name": row.get("workspaceName")}},
    }


def execute_task_query(sql: str, params: dict[str, Any]) -> list[Document]:
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(cast(Any, sql), params)
            rows = as_dict_rows(cur.fetchall())

    return [
        Document(
            id=to_point_id(settings.qdrant_collection_tasks, int(row["entityId"])),
            index=settings.qdrant_collection_tasks,
            score=1.0 - (rank * 0.001),
            source=task_source(row),
        )
        for rank, row in enumerate(rows)
    ]


def execute_project_query(sql: str, params: dict[str, Any]) -> list[Document]:
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(cast(Any, sql), params)
            rows = as_dict_rows(cur.fetchall())

    return [
        Document(
            id=to_point_id(settings.qdrant_collection_projects, int(row["entityId"])),
            index=settings.qdrant_collection_projects,
            score=1.0 - (rank * 0.001),
            source=project_source(row),
        )
        for rank, row in enumerate(rows)
    ]
