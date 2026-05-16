"""Qdrant filters used by chatbot retrieval."""

from qdrant_client.models import FieldCondition, Filter, MatchValue


def task_user_filter(user_id: int) -> Filter:
    """Match tasks created by the user or assigned to the user."""
    return Filter(
        should=[
            FieldCondition(key="createdById", match=MatchValue(value=user_id)),
            FieldCondition(key="assignees[].id", match=MatchValue(value=user_id)),
        ]
    )


def _with_user_visibility(scope: FieldCondition, user_id: int) -> Filter:
    """Combine a task scope with caller visibility constraints."""
    return Filter(must=[scope, task_user_filter(user_id)])


def build_task_scope_filter(
    user_id: int,
    workspace_id: int | None,
    project_id: int | None = None,
    is_personal: bool = False,
) -> Filter | None:
    """Choose the narrowest Qdrant task scope filter available."""
    if is_personal:
        return task_user_filter(user_id)
    if project_id is not None:
        return _with_user_visibility(
            FieldCondition(key="projectId", match=MatchValue(value=project_id)),
            user_id,
        )
    if workspace_id is not None:
        return _with_user_visibility(
            FieldCondition(key="workspaceId", match=MatchValue(value=workspace_id)),
            user_id,
        )
    return task_user_filter(user_id)
