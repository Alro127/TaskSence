"""Predefined safe SQL query implementations for chatbot context."""

from __future__ import annotations

from typing import Any

from app.chatbot.components import Document
from app.chatbot.components.sql_router_support.db import execute_project_query, execute_task_query

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

    return execute_task_query(sql, query_params)


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

    return execute_project_query(sql, {"user_id": user_id, "limit": limit})

