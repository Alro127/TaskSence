"""Minimal MCP client for delegating executable actions to Spring Boot."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.config.config import get_settings

logger = logging.getLogger(__name__)

_MCP_PROTOCOL_VERSION = "2024-11-05"


class SpringBootMcpClient:
    """Client wrapper for Spring Boot MCP endpoints.

    This is intentionally small and framework-agnostic so the action agent can
    evolve independently from chatbot retrieval.
    """

    def __init__(
        self,
        endpoint: str | None = None,
        timeout_seconds: float | None = None,
        api_key: str | None = None,
    ) -> None:
        settings = get_settings()
        configured_api_key = settings.mcp_api_key.get_secret_value()
        self.mcp_endpoint = (endpoint or settings.mcp_endpoint).rstrip("/")
        self.timeout_seconds = timeout_seconds or settings.mcp_timeout_seconds
        self.api_key = api_key if api_key is not None else configured_api_key

    def execute(self, action: str, arguments: dict[str, Any], user_id: int) -> dict[str, Any]:
        """Execute one action through Spring AI MCP Streamable HTTP."""
        return self._execute_streamable_http(action, arguments)

    def _execute_streamable_http(self, action: str, arguments: dict[str, Any]) -> dict[str, Any]:
        """Call an official MCP Streamable HTTP endpoint using JSON-RPC tool calls."""
        headers = self._headers(accept="application/json, text/event-stream")
        logger.info("[agent-mcp] call official MCP tool=%s endpoint=%s", action, self.mcp_endpoint)

        with httpx.Client(timeout=self.timeout_seconds) as client:
            self._initialize_session(client, headers)

            response = client.post(
                self.mcp_endpoint,
                json=self._rpc_payload(
                    "tools/call",
                    {"name": action, "arguments": arguments},
                ),
                headers=headers,
            )
            response.raise_for_status()

        rpc = self._decode_rpc_response(response)
        if "error" in rpc:
            raise RuntimeError(f"MCP tool call failed: {rpc['error']}")
        result = rpc.get("result")
        return {
            "code": "SUCCESS",
            "message": "MCP tool executed successfully",
            "data": {
                "action": action,
                "executed": True,
                "result": result,
            },
        }

    def list_tools(self, auth_token: str | None = None) -> list[dict[str, Any]]:
        """List official MCP tools from Spring for runtime discovery checks."""
        previous_api_key = self.api_key
        if auth_token:
            self.api_key = auth_token
        headers = self._headers(accept="application/json, text/event-stream")
        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                self._initialize_session(client, headers)
                response = client.post(
                    self.mcp_endpoint,
                    json=self._rpc_payload("tools/list", {}),
                    headers=headers,
                )
                response.raise_for_status()
            rpc = self._decode_rpc_response(response)
            if "error" in rpc:
                raise RuntimeError(f"MCP tool listing failed: {rpc['error']}")
            result = rpc.get("result")
            if isinstance(result, dict) and isinstance(result.get("tools"), list):
                return [tool for tool in result["tools"] if isinstance(tool, dict)]
            return []
        finally:
            self.api_key = previous_api_key

    def _initialize_session(self, client: httpx.Client, headers: dict[str, str]) -> None:
        init_response = client.post(
            self.mcp_endpoint,
            json=self._rpc_payload(
                "initialize",
                {
                    "protocolVersion": _MCP_PROTOCOL_VERSION,
                    "capabilities": {},
                    "clientInfo": {"name": "tasksense-ai-service", "version": "1.0.0"},
                },
            ),
            headers=headers,
        )
        init_response.raise_for_status()
        session_id = init_response.headers.get("Mcp-Session-Id") or init_response.headers.get("mcp-session-id")
        if session_id:
            headers["Mcp-Session-Id"] = session_id

        # Some MCP servers expect the initialized notification before tool calls.
        client.post(
            self.mcp_endpoint,
            json={"jsonrpc": "2.0", "method": "notifications/initialized"},
            headers=headers,
        )

    def _headers(self, accept: str = "application/json") -> dict[str, str]:
        headers = {"Content-Type": "application/json", "Accept": accept}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _rpc_payload(self, method: str, params: dict[str, Any]) -> dict[str, Any]:
        return {
            "jsonrpc": "2.0",
            "id": f"tasksense-{time.time_ns()}",
            "method": method,
            "params": params,
        }

    def _decode_rpc_response(self, response: httpx.Response) -> dict[str, Any]:
        content_type = response.headers.get("content-type", "")
        if "text/event-stream" in content_type:
            for line in response.text.splitlines():
                if line.startswith("data:"):
                    data = line.removeprefix("data:").strip()
                    if data:
                        parsed = httpx.Response(200, content=data).json()
                        if isinstance(parsed, dict):
                            return parsed
            raise ValueError("MCP SSE response did not contain JSON data")

        data = response.json()
        if not isinstance(data, dict):
            raise ValueError("MCP JSON-RPC response must be an object")
        return data

    def execute_with_token(
        self,
        action: str,
        arguments: dict[str, Any],
        user_id: int,
        auth_token: str | None,
    ) -> dict[str, Any]:
        """Execute one MCP tool call with the authenticated user JWT when available."""
        previous_api_key = self.api_key
        if auth_token:
            self.api_key = auth_token
        try:
            return self.execute(action=action, arguments=arguments, user_id=user_id)
        finally:
            self.api_key = previous_api_key
