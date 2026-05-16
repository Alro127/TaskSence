"""Row normalization helpers for source-of-truth payloads."""

from __future__ import annotations

from typing import Any

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

