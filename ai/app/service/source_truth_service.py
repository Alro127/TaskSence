"""PostgreSQL source-of-truth access for chatbot and embedding flows."""

from __future__ import annotations

import logging
from typing import Any, cast

from app.chatbot.components import Document
from app.config.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _connect():
    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError as exc:  # pragma: no cover - depends on runtime env
        raise RuntimeError(
            "psycopg is required for PostgreSQL source-of-truth operations"
        ) from exc

    return psycopg.connect(
        settings.effective_postgres_dsn,
        row_factory=cast(Any, dict_row),
    )


def _as_dict_rows(rows: Any) -> list[dict[str, Any]]:
    return [cast(dict[str, Any], row) for row in rows]


def _normalize_task_row(row: dict[str, Any]) -> dict[str, Any]:
    due_date = row.get("dueDate")
    return {
        "entityId": row["entityId"],
        "title": row.get("title"),
        "description": row.get("description"),
        "status": row.get("status"),
        "priority": row.get("priority"),
        "projectId": row.get("projectId"),
        "projectName": row.get("projectName"),
        "projectStatus": row.get("projectStatus"),
        "projectDescription": row.get("projectDescription"),
        "workspaceId": row.get("workspaceId"),
        "workspaceName": row.get("workspaceName"),
        "workspaceDescription": row.get("workspaceDescription"),
        "workspaceStatus": row.get("workspaceStatus"),
        "sprintId": row.get("sprintId"),
        "sprintName": row.get("sprintName"),
        "dueDate": due_date.isoformat() if due_date else None,
        "createdById": row.get("createdById"),
        "createdByName": row.get("createdByName"),
        "assignees": row.get("assignees") or [],
        "tags": row.get("tags") or [],
        "relation": row.get("relation") or {},
    }


def _normalize_project_row(row: dict[str, Any]) -> dict[str, Any]:
    start_date = row.get("startDate")
    end_date = row.get("endDate")
    return {
        "entityId": row["entityId"],
        "name": row.get("name"),
        "description": row.get("description"),
        "status": row.get("status"),
        "workspaceId": row.get("workspaceId"),
        "workspaceName": row.get("workspaceName"),
        "workspaceDescription": row.get("workspaceDescription"),
        "workspaceStatus": row.get("workspaceStatus"),
        "startDate": start_date.isoformat() if start_date else None,
        "endDate": end_date.isoformat() if end_date else None,
        "members": row.get("members") or [],
        "totalTasks": int(row.get("totalTasks") or 0),
        "todoTasks": int(row.get("todoTasks") or 0),
        "inProgressTasks": int(row.get("inProgressTasks") or 0),
        "reviewTasks": int(row.get("reviewTasks") or 0),
        "doneTasks": int(row.get("doneTasks") or 0),
        "relation": row.get("relation") or {},
    }


def _build_task_relation(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "workspace": {
            "id": row.get("workspaceId"),
            "name": row.get("workspaceName"),
        },
        "project": {
            "id": row.get("projectId"),
            "name": row.get("projectName"),
            "status": row.get("projectStatus"),
        },
        "sprint": {
            "id": row.get("sprintId"),
            "name": row.get("sprintName"),
        },
    }


def _build_project_relation(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "workspace": {
            "id": row.get("workspaceId"),
            "name": row.get("workspaceName"),
        }
    }


def fetch_tasks_for_embedding(last_entity_id: int, limit: int) -> list[dict[str, Any]]:
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
          AND t.id > %s
        GROUP BY
            t.id, t.title, t.description, t.status, t.priority,
            t.project_id, p.name, p.status, p.description, p.workspace_id,
            w.name, w.description, s.id, s.name,
            t.due_date, t.created_by, creator.full_name
        ORDER BY t.id ASC
        LIMIT %s
    """

    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (last_entity_id, limit))
                rows = _as_dict_rows(cur.fetchall())
            enriched_rows = []
            for row in rows:
                row["relation"] = _build_task_relation(row)
                enriched_rows.append(_normalize_task_row(row))
            return enriched_rows
    except Exception as exc:
        logger.warning("[source-truth] fetch_tasks_for_embedding failed: %s", exc)
        return []


def fetch_projects_for_embedding(last_entity_id: int, limit: int) -> list[dict[str, Any]]:
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
          AND p.id > %s
        GROUP BY
            p.id, p.name, p.description, p.status,
            p.workspace_id, w.name, w.description,
            p.start_date, p.end_date
        ORDER BY p.id ASC
        LIMIT %s
    """

    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (last_entity_id, limit))
                rows = _as_dict_rows(cur.fetchall())
            enriched_rows = []
            for row in rows:
                row["relation"] = _build_project_relation(row)
                enriched_rows.append(_normalize_project_row(row))
            return enriched_rows
    except Exception as exc:
        logger.warning("[source-truth] fetch_projects_for_embedding failed: %s", exc)
        return []


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
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (ids,))
                rows = _as_dict_rows(cur.fetchall())
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
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (ids,))
                rows = _as_dict_rows(cur.fetchall())
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


def resolve_project_by_name(project_name: str, user_id: int) -> int | None:
    """
    Find a project ID by name. First checks if user has access, then checks if project exists.

    Returns the project ID if found and accessible, None otherwise.
    """
    if not project_name or not project_name.strip():
        return None

    try:
        with _connect() as conn:
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
        with _connect() as conn:
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
