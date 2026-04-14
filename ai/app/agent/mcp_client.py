"""Minimal MCP client for delegating executable actions to Spring Boot."""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class SpringBootMcpClient:
    """Client wrapper for Spring Boot MCP endpoints.

    This is intentionally small and framework-agnostic so the action agent can
    evolve independently from chatbot retrieval.
    """

    def __init__(
        self,
        base_url: str | None = None,
        timeout_seconds: float | None = None,
        api_key: str | None = None,
    ) -> None:
        self.base_url = (base_url or os.getenv("SPRING_MCP_BASE_URL") or "http://localhost:8080/api/v1/mcp").rstrip("/")
        self.timeout_seconds = timeout_seconds or float(os.getenv("SPRING_MCP_TIMEOUT_SECONDS", "20"))
        self.api_key = api_key or os.getenv("SPRING_MCP_API_KEY", "")

    def execute(self, action: str, arguments: dict[str, Any], user_id: int) -> dict[str, Any]:
        """Execute one action through MCP server.

        The server contract is expected as:
        POST /execute
        {
            "action": "create_task",
            "arguments": {...},
            "actorUserId": 123
        }
        """
        payload = {
            "action": action,
            "arguments": arguments,
            "actorUserId": user_id,
        }

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        url = f"{self.base_url}/execute"
        logger.info("[agent-mcp] execute action=%s url=%s", action, url)

        with httpx.Client(timeout=self.timeout_seconds) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        if not isinstance(data, dict):
            raise ValueError("MCP response must be a JSON object")
        return data
