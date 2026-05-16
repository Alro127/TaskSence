"""Entity resolution helpers backed by PostgreSQL."""

from __future__ import annotations

import logging
from typing import Any, cast

from app.service.source_truth.db import connect

logger = logging.getLogger(__name__)

def resolve_project_by_name(project_name: str, user_id: int) -> int | None:
    """
    Find a project ID by name. First checks if user has access, then checks if project exists.

    Returns the project ID if found and accessible, None otherwise.
    """
    if not project_name or not project_name.strip():
        return None

    try:
        with connect() as conn:
            with conn.cursor() as cur:
                # First try: find accessible projects for user
                cur.execute(
                    """
                    SELECT p.id
                    FROM projects p
                    WHERE LOWER(p.name) ILIKE LOWER(%s)
                    AND (
                        p.id IN (
                            SELECT project_id
                            FROM project_members
                            WHERE user_id = %s
                              AND deleted_at IS NULL
                        )
                        OR p.workspace_id IN (
                            SELECT workspace_id
                            FROM workspace_members
                            WHERE user_id = %s
                              AND deleted_at IS NULL
                        )
                    )
                    AND p.deleted_at IS NULL
                    LIMIT 1
                    """,
                    (f"%{project_name}%", user_id, user_id),
                )
                row = cast(dict[str, Any] | None, cur.fetchone())
                if row:
                    logger.info("[source-truth] found accessible project: %r id=%s", project_name, row["id"])
                    return int(row["id"])

                # Fallback: check if project exists but user has no access
                cur.execute(
                    """
                    SELECT p.id
                    FROM projects p
                    WHERE LOWER(p.name) ILIKE LOWER(%s)
                    AND p.deleted_at IS NULL
                    LIMIT 1
                    """,
                    (f"%{project_name}%",),
                )
                row = cast(dict[str, Any] | None, cur.fetchone())
                if row:
                    logger.warning("[source-truth] project exists but user has no access: %r (user_id=%s)", project_name, user_id)
                    return None

                logger.debug("[source-truth] project not found: %r", project_name)
                return None

    except Exception as exc:
        logger.warning("[source-truth] resolve_project_by_name failed for %r: %s", project_name, exc)
        return None


