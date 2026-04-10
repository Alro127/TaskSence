"""
Tests for app.chatbot.components.classifier

Strategy
--------
- All LLM calls are mocked via unittest.mock.patch so no API key is needed.
- Tests cover: happy-path intents, JSON parse failure fallback,
  missing-key fallback, and the is_relevant=False path.
"""

import json
from unittest.mock import MagicMock, patch

import pytest

from app.chatbot.components.classifier import ClassifyResult, classify


# ── Helpers ───────────────────────────────────────────────────────────────────

def _mock_llm(response_text: str) -> MagicMock:
    """Return a mock LLM whose .invoke() returns response_text as .content."""
    llm = MagicMock()
    llm.invoke.return_value = MagicMock(content=response_text)
    return llm


def _call(query: str, llm_response: str) -> ClassifyResult:
    """Patch get_llm and call classify()."""
    with patch("app.chatbot.components.classifier.get_llm", return_value=_mock_llm(llm_response)):
        return classify(query)


# ── Happy-path tests ──────────────────────────────────────────────────────────

class TestClassifyRelevant:
    def test_task_query(self):
        result = _call(
            "task nào đang trễ?",
            '{"is_relevant": true, "intent": "task_query"}',
        )
        assert result["is_relevant"] is True
        assert result["intent"] == "task_query"

    def test_project_query(self):
        result = _call(
            "project nào chưa xong?",
            '{"is_relevant": true, "intent": "project_query"}',
        )
        assert result["is_relevant"] is True
        assert result["intent"] == "project_query"

    def test_unrelated_query(self):
        result = _call(
            "thời tiết hôm nay thế nào?",
            '{"is_relevant": false, "intent": "unrelated"}',
        )
        assert result["is_relevant"] is False
        assert result["intent"] == "unrelated"


# ── Markdown-fenced JSON ──────────────────────────────────────────────────────

class TestMarkdownFence:
    def test_json_code_block(self):
        raw = '```json\n{"is_relevant": true, "intent": "task_query"}\n```'
        result = _call("ai làm nhiều task nhất?", raw)
        assert result["is_relevant"] is True
        assert result["intent"] == "task_query"

    def test_plain_code_block(self):
        raw = '```\n{"is_relevant": false, "intent": "unrelated"}\n```'
        result = _call("1 + 1 = ?", raw)
        assert result["is_relevant"] is False


# ── Fallback behaviour ────────────────────────────────────────────────────────

class TestFallback:
    def test_invalid_json_falls_back_to_unrelated(self):
        result = _call("some query", "not valid json at all")
        assert result["is_relevant"] is False
        assert result["intent"] == "unrelated"

    def test_missing_is_relevant_key_falls_back(self):
        result = _call("some query", '{"intent": "task_query"}')
        assert result["is_relevant"] is False
        assert result["intent"] == "unrelated"

    def test_missing_intent_key_falls_back(self):
        result = _call("some query", '{"is_relevant": true}')
        assert result["is_relevant"] is False
        assert result["intent"] == "unrelated"

    def test_empty_json_object_falls_back(self):
        result = _call("some query", "{}")
        assert result["is_relevant"] is False
        assert result["intent"] == "unrelated"


# ── Return-type contract ──────────────────────────────────────────────────────

class TestReturnType:
    def test_is_relevant_is_bool(self):
        # LLM might return "1" or 1 — must be coerced to bool
        result = _call("task nào?", '{"is_relevant": 1, "intent": "task_query"}')
        assert isinstance(result["is_relevant"], bool)

    def test_intent_is_str(self):
        result = _call("task nào?", '{"is_relevant": true, "intent": "task_query"}')
        assert isinstance(result["intent"], str)

    def test_result_has_required_keys(self):
        result = _call("task nào?", '{"is_relevant": true, "intent": "task_query"}')
        assert "is_relevant" in result
        assert "intent" in result


# ── LLM is called exactly once per classify() invocation ─────────────────────

class TestLLMInteraction:
    def test_llm_invoked_once(self):
        llm = _mock_llm('{"is_relevant": true, "intent": "task_query"}')
        with patch("app.chatbot.components.classifier.get_llm", return_value=llm):
            classify("task nào trễ?")
        llm.invoke.assert_called_once()

    def test_system_and_human_messages_sent(self):
        from langchain_core.messages import HumanMessage, SystemMessage

        llm = _mock_llm('{"is_relevant": true, "intent": "task_query"}')
        with patch("app.chatbot.components.classifier.get_llm", return_value=llm):
            classify("task nào trễ?")

        messages = llm.invoke.call_args[0][0]
        assert isinstance(messages[0], SystemMessage)
        assert isinstance(messages[1], HumanMessage)
        assert "task nào trễ?" in messages[1].content
