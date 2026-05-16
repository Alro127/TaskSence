"""Tests for chatbot pipeline helpers."""

from __future__ import annotations

from typing import cast

from app.chatbot.components import Document
from app.service.chatbot.pipeline import _dedupe_documents


def test_dedupe_documents_keeps_highest_score_per_entity():
    docs = [
        {"id": "low", "index": "tasks", "score": 0.2, "source": {"entityId": 10}},
        {"id": "high", "index": "tasks", "score": 0.9, "source": {"entityId": 10}},
        {"id": "project", "index": "projects", "score": 0.8, "source": {"entityId": 10}},
    ]

    result = _dedupe_documents(cast(list[Document], docs))

    assert [doc["id"] for doc in result] == ["high", "project"]
