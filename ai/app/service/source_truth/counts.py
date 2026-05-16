"""Exact aggregate queries backed by PostgreSQL."""

from __future__ import annotations

import logging
from typing import Any, cast

from app.service.source_truth.db import connect

logger = logging.getLogger(__name__)

def count_tasks_exact(
    query: str,
    user_id: int,
    workspace_id: int | None,
    project_id: int | None,
    is_personal: bool,
) -> int:
    """Count tasks in PostgreSQL with exact source-of-truth filtering."""
    sql = [
        """
        SELECT COUNT(DISTINCT t.id) AS total
        FROM tasks t
        JOIN projects p ON p.id = t.project_id AND p.deleted_at IS NULL
        LEFT JOIN task_assignees ta ON ta.task_id = t.id
        WHERE t.deleted_at IS NULL
        """
    ]
    params: list[Any] = []

    if project_id is not None:
        sql.append("AND t.project_id = %s")
        params.append(project_id)
    elif workspace_id is not None:
        sql.append("AND p.workspace_id = %s")
        params.append(workspace_id)

    if is_personal:
        sql.append("AND (t.created_by = %s OR ta.user_id = %s)")
        params.extend([user_id, user_id])
    else:
        sql.append(
            """
            AND (
                t.created_by = %s
                OR ta.user_id = %s
                OR EXISTS (
                    SELECT 1 FROM project_members visible_pm
                    WHERE visible_pm.project_id = p.id
                      AND visible_pm.user_id = %s
                      AND visible_pm.deleted_at IS NULL
                )
                OR EXISTS (
                    SELECT 1 FROM workspace_members visible_wm
                    WHERE visible_wm.workspace_id = p.workspace_id
                      AND visible_wm.user_id = %s
                      AND visible_wm.deleted_at IS NULL
                )
            )
            """
        )
        params.extend([user_id, user_id, user_id, user_id])

    if query.strip():
        sql.append(
            """
            AND (
                t.title ILIKE %s
                OR COALESCE(t.description, '') ILIKE %s
                OR p.name ILIKE %s
            )
            """
        )
        keyword = f"%{query.strip()}%"
        params.extend([keyword, keyword, keyword])

    try:
        with connect() as conn:
            with conn.cursor() as cur:
                cur.execute(cast(Any, "\n".join(sql)), params)
                row = cast(dict[str, Any] | None, cur.fetchone())
        total = int(row["total"]) if row else 0
        if total == 0 and query.strip() and (project_id is not None or workspace_id is not None):
            logger.info(
                "[source-truth] count fallback to scope-only query project_id=%s workspace_id=%s",
                project_id,
                workspace_id,
            )
            return count_tasks_exact(
                query="",
                user_id=user_id,
                workspace_id=workspace_id,
                project_id=project_id,
                is_personal=is_personal,
            )

        return total
    except Exception as exc:
        logger.warning("[source-truth] count_tasks_exact failed: %s", exc)
        return 0
