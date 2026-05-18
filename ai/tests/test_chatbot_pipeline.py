"""Tests for chatbot pipeline helpers."""

from __future__ import annotations

from typing import cast

from app.chatbot.components import Document
from app.agent import AgentActionResult
from app.service.chatbot.pipeline import _action_success_message, _dedupe_documents


def test_dedupe_documents_keeps_highest_score_per_entity():
    docs = [
        {"id": "low", "index": "tasks", "score": 0.2, "source": {"entityId": 10}},
        {"id": "high", "index": "tasks", "score": 0.9, "source": {"entityId": 10}},
        {"id": "project", "index": "projects", "score": 0.8, "source": {"entityId": 10}},
    ]

    result = _dedupe_documents(cast(list[Document], docs))

    assert [doc["id"] for doc in result] == ["high", "project"]


def test_action_success_message_is_user_friendly():
    result = AgentActionResult(
        executed=True,
        action="create_project",
        message="action executed via MCP",
        payload={"mcp": {"data": {"result": {"name": "Website Redesign"}}}},
    )

    assert _action_success_message(result) == "Minh da tao project Website Redesign thanh cong."
    assert "MCP" not in _action_success_message(result)
