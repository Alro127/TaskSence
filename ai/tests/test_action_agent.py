"""Tests for action agent orchestration and MCP delegation."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.agent.orchestrator import run_action_agent


def _mock_llm(content: str) -> MagicMock:
    llm = MagicMock()
    llm.invoke.return_value = MagicMock(content=content)
    return llm


def test_run_action_agent_skips_non_action_query():
    llm_output = '{"should_execute":false,"action":"none","reason":"information query","arguments":{}}'
    with patch("app.agent.orchestrator.get_llm", return_value=_mock_llm(llm_output)):
        result = run_action_agent(query="list tasks cua toi", user_id=7)

    assert result.executed is False
    assert result.action == "none"


def test_run_action_agent_executes_via_mcp_when_planned():
    llm_output = '{"should_execute":true,"action":"create_task","reason":"explicit request","arguments":{"title":"Fix bug"}}'
    fake_client = MagicMock()
    fake_client.execute.return_value = {"ok": True, "id": 123}

    with patch("app.agent.orchestrator.get_llm", return_value=_mock_llm(llm_output)):
        result = run_action_agent(query="create task Fix bug", user_id=7, mcp_client=fake_client)

    assert result.executed is True
    assert result.action == "create_task"
    fake_client.execute.assert_called_once()
