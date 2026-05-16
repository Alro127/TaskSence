"""Hydrate vector-search documents with fresh PostgreSQL rows."""

from __future__ import annotations

import logging
from typing import Any, cast

from app.chatbot.components import Document
from app.config.config import get_settings
from app.service.source_truth.db import as_dict_rows, connect
from app.service.source_truth.rows import _build_project_relation, _build_task_relation, _normalize_project_row, _normalize_task_row

logger = logging.getLogger(__name__)
settings = get_settings()

def _fetch_tasks_by_ids(ids: list[int]) -> dict[int, dict[str, Any]]:
    if not ids:
        return {}

    query = """
        SELECT
            t.id AS "entityId",
            t.title,
            t.description,
            t.status::text AS status,
            t.priority::text AS priority,
            t.project_id AS "projectId",
            p.name AS "projectName",
            p.status::text AS "projectStatus",
            p.description AS "projectDescription",
            p.workspace_id AS "workspaceId",
            w.name AS "workspaceName",
            w.description AS "workspaceDescription",
            s.id AS "sprintId",
            s.name AS "sprintName",
            t.due_date AS "dueDate",
            t.created_by AS "createdById",
            creator.full_name AS "createdByName",
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', assignee.id, 'fullName', assignee.full_name)
                ) FILTER (WHERE assignee.id IS NOT NULL),
                '[]'::json
            ) AS assignees,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', tg.id, 'name', tg.name, 'color', tg.color)
                ) FILTER (WHERE tg.id IS NOT NULL),
                '[]'::json
            ) AS tags
        FROM tasks t
        JOIN projects p ON p.id = t.project_id AND p.deleted_at IS NULL
        JOIN workspaces w ON w.id = p.workspace_id AND w.deleted_at IS NULL
        LEFT JOIN sprints s ON s.id = t.sprint_id AND s.deleted_at IS NULL
        LEFT JOIN users creator ON creator.id = t.created_by
        LEFT JOIN task_assignees ta ON ta.task_id = t.id
        LEFT JOIN users assignee ON assignee.id = ta.user_id
        LEFT JOIN task_tags tt ON tt.task_id = t.id
        LEFT JOIN tags tg ON tg.id = tt.tag_id AND tg.deleted_at IS NULL
        WHERE t.deleted_at IS NULL
          AND t.id = ANY(%s)
        GROUP BY
            t.id, t.title, t.description, t.status, t.priority,
            t.project_id, p.name, p.status, p.description, p.workspace_id,
            w.name, w.description, s.id, s.name,
            t.due_date, t.created_by, creator.full_name
    """

    try:
        with connect() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (ids,))
                rows = as_dict_rows(cur.fetchall())
            return {
                int(r["entityId"]): _normalize_task_row({**r, "relation": _build_task_relation(r)})
                for r in rows
            }
    except Exception as exc:
        logger.warning("[source-truth] _fetch_tasks_by_ids failed: %s", exc)
        return {}


def _fetch_projects_by_ids(ids: list[int]) -> dict[int, dict[str, Any]]:
    if not ids:
        return {}

    query = """
        SELECT
            p.id AS "entityId",
            p.name,
            p.description,
            p.status::text AS status,
            p.workspace_id AS "workspaceId",
            w.name AS "workspaceName",
            w.description AS "workspaceDescription",
            p.start_date AS "startDate",
            p.end_date AS "endDate",
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', member.id, 'fullName', member.full_name)
                ) FILTER (WHERE member.id IS NOT NULL),
                '[]'::json
            ) AS members,
            COUNT(DISTINCT t.id) AS "totalTasks",
            COUNT(DISTINCT t.id) FILTER (WHERE t.status::text = 'TODO') AS "todoTasks",
            COUNT(DISTINCT t.id) FILTER (WHERE t.status::text = 'IN_PROGRESS') AS "inProgressTasks",
            COUNT(DISTINCT t.id) FILTER (WHERE t.status::text = 'REVIEW') AS "reviewTasks",
            COUNT(DISTINCT t.id) FILTER (WHERE t.status::text = 'DONE') AS "doneTasks"
        FROM projects p
        JOIN workspaces w ON w.id = p.workspace_id AND w.deleted_at IS NULL
        LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.deleted_at IS NULL
        LEFT JOIN users member ON member.id = pm.user_id
        LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND p.id = ANY(%s)
        GROUP BY
            p.id, p.name, p.description, p.status,
            p.workspace_id, w.name, w.description,
            p.start_date, p.end_date
    """

    try:
        with connect() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (ids,))
                rows = as_dict_rows(cur.fetchall())
            return {
                int(r["entityId"]): _normalize_project_row({**r, "relation": _build_project_relation(r)})
                for r in rows
            }
    except Exception as exc:
        logger.warning("[source-truth] _fetch_projects_by_ids failed: %s", exc)
        return {}


def hydrate_documents_with_postgres(docs: list[Document]) -> list[Document]:
    """Replace Qdrant payload with fresh PostgreSQL data when possible."""
    task_ids: list[int] = []
    project_ids: list[int] = []

    for doc in docs:
        entity_id = doc["source"].get("entityId")
        if not isinstance(entity_id, int):
            continue
        if doc["index"] == settings.qdrant_collection_tasks:
            task_ids.append(entity_id)
        elif doc["index"] == settings.qdrant_collection_projects:
            project_ids.append(entity_id)

    task_map = _fetch_tasks_by_ids(task_ids)
    project_map = _fetch_projects_by_ids(project_ids)

    hydrated: list[Document] = []
    for doc in docs:
        entity_id = doc["source"].get("entityId")
        source = doc["source"]
        if isinstance(entity_id, int):
            if doc["index"] == settings.qdrant_collection_tasks and entity_id in task_map:
                source = task_map[entity_id]
            elif (
                doc["index"] == settings.qdrant_collection_projects
                and entity_id in project_map
            ):
                source = project_map[entity_id]

        hydrated.append(
            Document(
                id=doc["id"],
                index=doc["index"],
                score=doc["score"],
                source=source,
            )
        )

    return hydrated

