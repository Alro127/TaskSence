"""Tests for app.chatbot.components.retriever (Qdrant implementation)."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from qdrant_client.http.exceptions import UnexpectedResponse

import app.chatbot.components.retriever as retriever_module
from app.chatbot.components.retriever import (
    _build_task_scope_filter,
    _parse_points,
    _task_user_filter,
    _vector_search,
    count_tasks,
    retrieve,
)


def _point(point_id: str, score: float, payload: dict):
    return SimpleNamespace(id=point_id, score=score, payload=payload)


class TestTaskScopeFilter:
    def test_personal_has_highest_priority(self):
        result = _build_task_scope_filter(
            user_id=7,
            workspace_id=11,
            project_id=22,
            is_personal=True,
        )
        dumped = result.model_dump() if result else {}
        should = dumped.get("should", [])
        keys = {item["key"] for item in should}
        assert "createdById" in keys
        assert "assignees[].id" in keys

    def test_project_priority_over_workspace(self):
        result = _build_task_scope_filter(
            user_id=7,
            workspace_id=11,
            project_id=22,
            is_personal=False,
        )
        dumped = result.model_dump() if result else {}
        assert dumped["must"][0]["key"] == "projectId"
        assert dumped["must"][0]["match"]["value"] == 22

    def test_workspace_used_when_no_project(self):
        result = _build_task_scope_filter(
            user_id=7,
            workspace_id=11,
            project_id=None,
            is_personal=False,
        )
        dumped = result.model_dump() if result else {}
        assert dumped["must"][0]["key"] == "workspaceId"
        assert dumped["must"][0]["match"]["value"] == 11

    def test_none_when_no_scope(self):
        result = _build_task_scope_filter(
            user_id=7,
            workspace_id=None,
            project_id=None,
            is_personal=False,
        )
        assert result is None


class TestTaskUserFilter:
    def test_contains_creator_and_assignee_conditions(self):
        result = _task_user_filter(9)
        dumped = result.model_dump()
        should = dumped["should"]
        keys = {item["key"] for item in should}
        assert keys == {"createdById", "assignees[].id"}


class TestParsePoints:
    def test_parse_points_maps_qdrant_points(self):
        results = [_point("1", 0.9, {"title": "A"}), _point("2", 0.4, {})]
        docs = _parse_points(results, "tasks")

        assert docs == [
            {"id": "1", "index": "tasks", "score": 0.9, "source": {"title": "A"}},
            {"id": "2", "index": "tasks", "score": 0.4, "source": {}},
        ]


class TestVectorSearch:
    def test_query_points_path(self):
        client = MagicMock()
        client.query_points.return_value = SimpleNamespace(points=[_point("1", 0.7, {})])

        with patch.object(retriever_module, "_get_client", return_value=client):
            result = _vector_search(
                collection_name="tasks",
                vector=[0.1, 0.2],
                query_filter=None,
                limit=5,
                with_payload=True,
            )

        assert len(result) == 1
        client.query_points.assert_called_once()

    def test_legacy_search_path(self):
        class LegacyClient:
            def search(self, **kwargs):
                return [_point("2", 0.5, {})]

        with patch.object(retriever_module, "_get_client", return_value=LegacyClient()):
            with patch("builtins.hasattr", side_effect=lambda obj, name: name != "query_points"):
                result = _vector_search(
                    collection_name="tasks",
                    vector=[0.1],
                    query_filter=None,
                    limit=5,
                    with_payload=True,
                )

        assert len(result) == 1
        assert result[0].id == "2"

    def test_unexpected_response_returns_empty(self):
        client = MagicMock()
        client.query_points.side_effect = UnexpectedResponse(
            status_code=400,
            reason_phrase="Bad Request",
            content=b"{}",
            headers={"content-type": "application/json"}, # type: ignore
        )

        with patch.object(retriever_module, "_get_client", return_value=client):
            result = _vector_search(
                collection_name="tasks",
                vector=[0.1, 0.2],
                query_filter=None,
                limit=5,
                with_payload=True,
            )

        assert result == []


class TestRetrieve:
    def test_blank_query_returns_empty(self):
        with patch.object(retriever_module, "_search_tasks") as mock_tasks:
            docs = retrieve("   ", user_id=1)

        assert docs == []
        mock_tasks.assert_not_called()

    def test_without_workspace_skips_project_search(self):
        with patch.object(retriever_module, "_search_tasks", return_value=[
            {"id": "t1", "index": "tasks", "score": 0.4, "source": {}},
        ]) as mock_tasks:
            with patch.object(retriever_module, "_search_projects") as mock_projects:
                docs = retrieve("query", user_id=1, workspace_id=None)

        assert len(docs) == 1
        mock_tasks.assert_called_once()
        mock_projects.assert_not_called()

    def test_with_workspace_merges_and_sorts(self):
        tasks = [{"id": "t1", "index": "tasks", "score": 0.2, "source": {}}]
        projects = [{"id": "p1", "index": "projects", "score": 0.9, "source": {}}]

        with patch.object(retriever_module, "_search_tasks", return_value=tasks):
            with patch.object(retriever_module, "_search_projects", return_value=projects):
                docs = retrieve("query", user_id=1, workspace_id=10)

        assert [d["id"] for d in docs] == ["p1", "t1"]


class TestCountTasks:
    def test_count_with_query_uses_vector_result_len(self):
        client = MagicMock()
        with patch.object(retriever_module, "_get_client", return_value=client):
            with patch.object(retriever_module, "_embed_query", return_value=[0.1]):
                with patch.object(
                    retriever_module,
                    "_vector_search",
                    return_value=[_point("1", 0.5, {}), _point("2", 0.4, {})],
                ):
                    total = count_tasks("overdue", workspace_id=1)

        assert total == 2
        client.count.assert_not_called()

    def test_count_without_query_uses_exact_count_api(self):
        client = MagicMock()
        client.count.return_value = SimpleNamespace(count=12)

        with patch.object(retriever_module, "_get_client", return_value=client):
            total = count_tasks("", workspace_id=1)

        assert total == 12
        client.count.assert_called_once()
