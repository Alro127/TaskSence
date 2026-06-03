"""Types and constants for SQL router."""

from typing import Any, TypedDict

ALLOWED_QUERY_IDS = {
    "my_tasks_list",
    "overdue_my_tasks",
    "tasks_by_project_id",
    "tasks_by_project_name_like",
    "related_projects",
}


class SqlPlan(TypedDict):
    query_id: str
    params: dict[str, Any]
