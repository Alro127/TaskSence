"""Minimal MCP client for delegating executable actions to Spring Boot."""

from __future__ import annotations

import logging
import json
import time
from typing import Any
from urllib.parse import urlparse
from urllib.parse import urlunparse

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
        """Call the Spring AI WebMVC SSE MCP endpoint using JSON-RPC tool calls."""
        headers = self._headers(accept="application/json, text/event-stream")
        logger.info("[agent-mcp] call official MCP tool=%s endpoint=%s", action, self.mcp_endpoint)
        tool_arguments = self._wrap_tool_request(arguments)

        with httpx.Client(timeout=self.timeout_seconds) as client:
            with client.stream("GET", self.mcp_endpoint, headers=headers) as stream:
                stream.raise_for_status()
                lines = stream.iter_lines()
                message_endpoint = self._read_sse_endpoint(lines)

                initialize_id = self._post_sse_message(
                    client,
                    message_endpoint,
                    self._rpc_payload(
                        "initialize",
                        {
                            "protocolVersion": _MCP_PROTOCOL_VERSION,
                            "capabilities": {},
                            "clientInfo": {"name": "tasksense-ai-service", "version": "1.0.0"},
                        },
                    ),
                    headers,
                )
                self._read_sse_rpc_response(lines, initialize_id)

                self._post_sse_message(
                    client,
                    message_endpoint,
                    {"jsonrpc": "2.0", "method": "notifications/initialized"},
                    headers,
                )

                call_payload = self._rpc_payload(
                    "tools/call",
                    {"name": action, "arguments": tool_arguments},
                )
                call_id = self._post_sse_message(client, message_endpoint, call_payload, headers)
                rpc = self._read_sse_rpc_response(lines, call_id)

        if "error" in rpc:
            raise RuntimeError(f"MCP tool call failed: {rpc['error']}")
        result = self._normalize_tool_result(rpc.get("result"))
        if isinstance(result, dict) and result.get("isError") is True:
            raise RuntimeError(f"MCP tool returned an error: {self._tool_result_text(result)}")
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
                with client.stream("GET", self.mcp_endpoint, headers=headers) as stream:
                    stream.raise_for_status()
                    lines = stream.iter_lines()
                    message_endpoint = self._read_sse_endpoint(lines)
                    initialize_id = self._post_sse_message(
                        client,
                        message_endpoint,
                        self._rpc_payload(
                            "initialize",
                            {
                                "protocolVersion": _MCP_PROTOCOL_VERSION,
                                "capabilities": {},
                                "clientInfo": {"name": "tasksense-ai-service", "version": "1.0.0"},
                            },
                        ),
                        headers,
                    )
                    self._read_sse_rpc_response(lines, initialize_id)
                    self._post_sse_message(
                        client,
                        message_endpoint,
                        {"jsonrpc": "2.0", "method": "notifications/initialized"},
                        headers,
                    )
                    list_payload = self._rpc_payload("tools/list", {})
                    list_id = self._post_sse_message(client, message_endpoint, list_payload, headers)
                    rpc = self._read_sse_rpc_response(lines, list_id)
            if "error" in rpc:
                raise RuntimeError(f"MCP tool listing failed: {rpc['error']}")
            result = rpc.get("result")
            if isinstance(result, dict) and isinstance(result.get("tools"), list):
                return [tool for tool in result["tools"] if isinstance(tool, dict)]
            return []
        finally:
            self.api_key = previous_api_key

    def _read_sse_endpoint(self, lines: Any) -> str:
        event = None
        for line in lines:
            if line.startswith("event:"):
                event = line.removeprefix("event:").strip()
                continue
            if line.startswith("data:") and event == "endpoint":
                endpoint = line.removeprefix("data:").strip()
                return self._resolve_sse_message_endpoint(endpoint)
        raise ValueError("MCP SSE endpoint event was not received")

    def _resolve_sse_message_endpoint(self, endpoint: str) -> str:
        if urlparse(endpoint).scheme:
            return endpoint
        if endpoint.startswith("/"):
            parsed = urlparse(self.mcp_endpoint)
            context_path = parsed.path.removesuffix("/mcp")
            return urlunparse((parsed.scheme, parsed.netloc, f"{context_path}{endpoint}", "", "", ""))
        base_path = self.mcp_endpoint.rsplit("/", 1)[0]
        return f"{base_path}/{endpoint.lstrip('/')}"

    def _wrap_tool_request(self, arguments: dict[str, Any]) -> dict[str, Any]:
        if "toolRequest" in arguments:
            return arguments
        return {"toolRequest": arguments}

    def _normalize_tool_result(self, result: Any) -> Any:
        if not isinstance(result, dict) or result.get("isError") is True:
            return result
        text = self._tool_result_text(result)
        if not text:
            return result
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            return result
        return parsed if isinstance(parsed, dict) else result

    def _tool_result_text(self, result: dict[str, Any]) -> str:
        content = result.get("content")
        if not isinstance(content, list):
            return ""
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text = item.get("text")
                if text:
                    parts.append(str(text))
        return "\n".join(parts)

    def _post_sse_message(
        self,
        client: httpx.Client,
        message_endpoint: str,
        payload: dict[str, Any],
        headers: dict[str, str],
    ) -> str | None:
        response = client.post(message_endpoint, json=payload, headers=headers)
        response.raise_for_status()
        rpc_id = payload.get("id")
        return rpc_id if isinstance(rpc_id, str) else None

    def _read_sse_rpc_response(self, lines: Any, expected_id: str | None) -> dict[str, Any]:
        for line in lines:
            if not line.startswith("data:"):
                continue
            data = line.removeprefix("data:").strip()
            if not data:
                continue
            parsed = httpx.Response(200, content=data).json()
            if not isinstance(parsed, dict):
                continue
            if expected_id is None or parsed.get("id") == expected_id:
                return parsed
        raise ValueError("MCP SSE response was not received")

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
