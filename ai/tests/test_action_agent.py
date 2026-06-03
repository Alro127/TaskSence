"""Tests for action agent orchestration and MCP delegation."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.agent.mcp_client import SpringBootMcpClient
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


def test_run_action_agent_uses_natural_tool_when_project_id_missing():
    llm_output = '{"should_execute":true,"action":"create_task","reason":"explicit request","arguments":{"title":"Fix bug"}}'
    fake_client = MagicMock()
    fake_client.execute_with_token.return_value = {"code": "SUCCESS", "data": {"result": {"id": 123}}}

    with patch("app.agent.orchestrator.get_llm", return_value=_mock_llm(llm_output)):
        result = run_action_agent(query="create task Fix bug", user_id=7, mcp_client=fake_client)

    assert result.executed is True
    assert result.action == "create_task"
    fake_client.execute_with_token.assert_called_once()
    assert fake_client.execute_with_token.call_args.kwargs["action"] == "create_task_natural"


def test_run_action_agent_assigns_current_user_when_user_says_me():
    llm_output = '{"should_execute":true,"action":"create_task","reason":"explicit request","arguments":{"projectName":"Website Redesign","title":"update ui admin"}}'
    fake_client = MagicMock()
    fake_client.execute_with_token.return_value = {"code": "SUCCESS", "data": {"result": {"id": 123}}}

    with patch("app.agent.orchestrator.get_llm", return_value=_mock_llm(llm_output)):
        result = run_action_agent(query="tao task update ui admin va dinh toi vao task do", user_id=7, mcp_client=fake_client)

    assert result.executed is True
    assert fake_client.execute_with_token.call_args.kwargs["arguments"]["assigneeIds"] == [7]


def test_run_action_agent_executes_via_mcp_when_planned():
    llm_output = '{"should_execute":true,"action":"create_task","reason":"explicit request","arguments":{"projectId":3,"title":"Fix bug"}}'
    fake_client = MagicMock()
    fake_client.execute_with_token.return_value = {"ok": True, "id": 123}

    with patch("app.agent.orchestrator.get_llm", return_value=_mock_llm(llm_output)):
        result = run_action_agent(query="create task Fix bug in project 3", user_id=7, mcp_client=fake_client)

    assert result.executed is True
    assert result.action == "create_task"
    fake_client.execute_with_token.assert_called_once()


def test_run_action_agent_returns_clarification_for_ambiguous_resolution():
    llm_output = '{"should_execute":true,"action":"create_task","reason":"explicit request","arguments":{"projectName":"Atlas","title":"Fix bug"}}'
    fake_client = MagicMock()
    fake_client.execute_with_token.return_value = {
        "code": "SUCCESS",
        "data": {
            "result": {
                "status": "AMBIGUOUS",
                "candidates": [
                    {"projectName": "Atlas", "workspaceName": "A"},
                    {"projectName": "Atlas", "workspaceName": "B"},
                ],
            }
        },
    }

    with patch("app.agent.orchestrator.get_llm", return_value=_mock_llm(llm_output)):
        result = run_action_agent(query="create task Fix bug in Atlas", user_id=7, mcp_client=fake_client)

    assert result.executed is False
    assert result.action == "create_task"
    assert "Atlas / A" in result.message


def test_run_action_agent_returns_confirmation_required_for_update():
    llm_output = '{"should_execute":true,"action":"update_task","reason":"explicit request","arguments":{"projectName":"Atlas","taskTitle":"Fix bug","priority":"HIGH"}}'
    fake_client = MagicMock()
    fake_client.execute_with_token.return_value = {
        "code": "SUCCESS",
        "data": {
            "result": {
                "status": "CONFIRMATION_REQUIRED",
                "message": "Confirm before updating this task",
                "confirmationToken": "tok_123",
            }
        },
    }

    with patch("app.agent.orchestrator.get_llm", return_value=_mock_llm(llm_output)):
        result = run_action_agent(query="update task Fix bug", user_id=7, mcp_client=fake_client)

    assert result.executed is False
    assert result.action == "update_task"
    assert "Confirm before updating this task" in result.message
    assert "tok_123" not in result.message
    assert result.payload is not None
    assert result.payload["mcp"]["data"]["result"]["confirmationToken"] == "tok_123"
    assert fake_client.execute_with_token.call_args.kwargs["action"] == "update_task_natural"


def test_mcp_client_resolves_sse_message_endpoint_under_api_context():
    client = SpringBootMcpClient(endpoint="http://localhost:8080/api/v1/mcp")

    endpoint = client._resolve_sse_message_endpoint("/mcp/message?sessionId=abc")

    assert endpoint == "http://localhost:8080/api/v1/mcp/message?sessionId=abc"


def test_mcp_client_wraps_arguments_for_single_tool_param():
    client = SpringBootMcpClient(endpoint="http://localhost:8080/api/v1/mcp")

    assert client._wrap_tool_request({"title": "Fix bug"}) == {"toolRequest": {"title": "Fix bug"}}
    assert client._wrap_tool_request({"toolRequest": {"title": "Fix bug"}}) == {"toolRequest": {"title": "Fix bug"}}


def test_mcp_client_normalizes_text_json_tool_result():
    client = SpringBootMcpClient(endpoint="http://localhost:8080/api/v1/mcp")

    result = client._normalize_tool_result(
        {"content": [{"type": "text", "text": '{"status":"CONFIRMATION_REQUIRED","confirmationToken":"tok"}'}], "isError": False}
    )

    assert result == {"status": "CONFIRMATION_REQUIRED", "confirmationToken": "tok"}
