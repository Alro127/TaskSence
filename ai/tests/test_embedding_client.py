"""Tests for app.client.embedding OpenRouterEmbeddings retry behavior."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import httpx
import pytest
from pydantic import SecretStr

from app.client.embedding import OpenRouterEmbeddings


def _success_response() -> httpx.Response:
    request = httpx.Request("POST", "https://example.com/embeddings")
    return httpx.Response(
        status_code=200,
        request=request,
        json={"data": [{"embedding": [0.1, 0.2, 0.3]}]},
    )


def _status_error(status_code: int) -> httpx.HTTPStatusError:
    request = httpx.Request("POST", "https://example.com/embeddings")
    response = httpx.Response(status_code=status_code, request=request, json={"error": "x"})
    return httpx.HTTPStatusError("error", request=request, response=response)


class TestOpenRouterEmbeddingsRetry:
    def test_retries_on_transport_error_and_then_succeeds(self):
        embedding = OpenRouterEmbeddings(
            api_key=SecretStr("test-key"),
            model="openai/text-embedding-3-large",
            base_url="https://example.com",
            max_retries=3,
            retry_backoff_seconds=0.01,
        )

        with patch.object(
            embedding._client,
            "post",
            side_effect=[httpx.RemoteProtocolError("Server disconnected"), _success_response()],
        ) as mock_post:
            with patch("app.client.embedding.time.sleep") as mock_sleep:
                vectors = embedding.embed_documents(["hello"])

        assert len(vectors) == 1
        assert vectors[0] == [0.1, 0.2, 0.3]
        assert mock_post.call_count == 2
        mock_sleep.assert_called_once()

    def test_retries_on_retryable_http_status(self):
        embedding = OpenRouterEmbeddings(
            api_key=SecretStr("test-key"),
            model="openai/text-embedding-3-large",
            base_url="https://example.com",
            max_retries=3,
            retry_backoff_seconds=0.01,
        )

        with patch.object(
            embedding._client,
            "post",
            side_effect=[_status_error(429), _success_response()],
        ) as mock_post:
            with patch("app.client.embedding.time.sleep") as mock_sleep:
                vectors = embedding.embed_documents(["hello"])

        assert len(vectors) == 1
        assert mock_post.call_count == 2
        mock_sleep.assert_called_once()

    def test_does_not_retry_on_non_retryable_http_status(self):
        embedding = OpenRouterEmbeddings(
            api_key=SecretStr("test-key"),
            model="openai/text-embedding-3-large",
            base_url="https://example.com",
            max_retries=3,
            retry_backoff_seconds=0.01,
        )

        with patch.object(embedding._client, "post", side_effect=[_status_error(400)]) as mock_post:
            with patch("app.client.embedding.time.sleep") as mock_sleep:
                with pytest.raises(httpx.HTTPStatusError):
                    embedding.embed_documents(["hello"])

        assert mock_post.call_count == 1
        mock_sleep.assert_not_called()
