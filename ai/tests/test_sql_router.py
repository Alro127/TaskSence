"""Tests for SQL router planning and safe query fallback."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.chatbot.components.sql_router import _build_plan, query_postgres_documents


def _mock_llm(content: str) -> MagicMock:
    llm = MagicMock()
    llm.invoke.return_value = MagicMock(content=content)
    return llm


def test_build_plan_accepts_allowed_query_id_and_clamps_limit():
    raw = '{"query_id":"my_tasks_list","params":{"limit":999,"status":"todo"}}'
    with patch("app.chatbot.components.sql_router.get_llm", return_value=_mock_llm(raw)):
        plan = _build_plan(
            query="list my tasks",
            intent="task_query",
            is_personal=True,
            requested_limit=None,
            project_id=None,
        )

    assert plan is not None
    assert plan["query_id"] == "my_tasks_list"
    assert plan["params"]["limit"] == 100
    assert plan["params"]["status"] == "TODO"


def test_query_postgres_documents_returns_empty_when_plan_invalid():
    with patch("app.chatbot.components.sql_router.get_llm", return_value=_mock_llm("not-json")):
        docs = query_postgres_documents(
            query="list my tasks",
            user_id=1,
            intent="task_query",
            is_personal=True,
            requested_limit=10,
            project_id=None,
        )

    assert docs == []
