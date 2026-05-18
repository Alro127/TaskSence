"""Exact response cache for low-risk chatbot responses.

The cache is scoped by user and prompt/model version, and stores no raw prompt
text in keys. Redis is used when configured; a small in-process TTL cache keeps
local development fast and provides a safe fallback when Redis is unavailable.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import re
import time
import unicodedata
from dataclasses import dataclass
from typing import Any

from app.config.config import get_settings

logger = logging.getLogger(__name__)

_SENSITIVE_PATTERNS = (
    re.compile(r"\b(token|secret|password|credential|api[_ -]?key|private key)\b", re.IGNORECASE),
    re.compile(r"\b(latest|current|now|today|real[- ]?time|vừa|mới nhất|hôm nay|bây giờ)\b", re.IGNORECASE),
    re.compile(r"\b(that|this|it|them|those|above|previous|đó|này|trên|vừa rồi)\b", re.IGNORECASE),
)


@dataclass(frozen=True)
class CachedChatResponse:
    answer: str
    sources: list[dict[str, Any]]
    reasoning: list[str] | None = None


class _MemoryTtlCache:
    def __init__(self, max_items: int, ttl_seconds: int) -> None:
        self.max_items = max(1, max_items)
        self.ttl_seconds = max(1, ttl_seconds)
        self._items: dict[str, tuple[float, dict[str, Any]]] = {}

    def get(self, key: str) -> dict[str, Any] | None:
        item = self._items.get(key)
        if item is None:
            return None
        expires_at, value = item
        if expires_at <= time.time():
            self._items.pop(key, None)
            return None
        return value

    def set(self, key: str, value: dict[str, Any], ttl_seconds: int) -> None:
        if len(self._items) >= self.max_items:
            oldest_key = min(self._items, key=lambda item_key: self._items[item_key][0])
            self._items.pop(oldest_key, None)
        ttl = max(1, min(ttl_seconds, self.ttl_seconds))
        self._items[key] = (time.time() + ttl, value)


settings = get_settings()
_memory_cache = _MemoryTtlCache(settings.cache_memory_max_items, settings.cache_memory_ttl_seconds)
_redis_client: Any | None = None


def normalize_query(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    return " ".join(normalized.strip().split())


def is_cacheable_query(query: str) -> bool:
    normalized = normalize_query(query)
    if not normalized or len(normalized) > 1_000:
        return False
    return not any(pattern.search(normalized) for pattern in _SENSITIVE_PATTERNS)


def build_chat_cache_key(query: str, user_id: int, agent: bool) -> str:
    settings = get_settings()
    normalized_query = normalize_query(query)
    payload = {
        "schema": 1,
        "scope": "user",
        "userId": user_id,
        "agent": agent,
        "query": normalized_query,
        "promptVersion": settings.cache_prompt_version,
        "modelProvider": settings.llm_provider,
        "model": _model_name(settings),
    }
    secret = settings.jwt_secret or "tasksense-ai-cache"
    digest = hmac.new(
        secret.encode("utf-8"),
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{settings.cache_redis_prefix}:chat:exact:{digest}"


def get_cached_chat_response(key: str) -> CachedChatResponse | None:
    settings = get_settings()
    if not settings.cache_enabled or not settings.cache_read_enabled:
        return None

    cached = _memory_cache.get(key)
    if cached is None:
        cached = _redis_get_json(key)
        if cached is not None:
            _memory_cache.set(key, cached, settings.cache_memory_ttl_seconds)

    if cached is None:
        logger.info("[ai-cache] miss key=%s", _safe_key_id(key))
        return None

    logger.info("[ai-cache] hit key=%s", _safe_key_id(key))
    return _coerce_cached_response(cached)


def set_cached_chat_response(key: str, response: dict[str, Any]) -> None:
    settings = get_settings()
    if not settings.cache_enabled or not settings.cache_write_enabled:
        return

    payload = {
        "answer": response.get("answer", ""),
        "sources": response.get("sources", []),
        "reasoning": response.get("reasoning"),
        "createdAt": int(time.time()),
        "promptVersion": settings.cache_prompt_version,
    }
    _memory_cache.set(key, payload, settings.cache_memory_ttl_seconds)
    _redis_set_json(key, payload, settings.cache_ttl_seconds)
    logger.info("[ai-cache] stored key=%s ttl=%s", _safe_key_id(key), settings.cache_ttl_seconds)


def _coerce_cached_response(payload: dict[str, Any]) -> CachedChatResponse | None:
    answer = payload.get("answer")
    sources = payload.get("sources", [])
    if not isinstance(answer, str) or not isinstance(sources, list):
        return None
    reasoning = payload.get("reasoning")
    return CachedChatResponse(
        answer=answer,
        sources=[source for source in sources if isinstance(source, dict)],
        reasoning=reasoning if isinstance(reasoning, list) else None,
    )


def _model_name(settings: Any) -> str:
    if settings.llm_provider == "gemini":
        return settings.gemini_model
    if settings.llm_provider == "openrouter":
        return settings.openrouter_model
    if settings.llm_provider == "siliconflow":
        return settings.siliconflow_model
    return settings.openai_model


def _redis() -> Any | None:
    global _redis_client
    settings = get_settings()
    if not settings.redis_url:
        return None
    if _redis_client is not None:
        return _redis_client
    try:
        import redis  # type: ignore[import-not-found]

        client: Any = redis.Redis.from_url(settings.redis_url, decode_responses=True, socket_timeout=1.5)
        client.ping()
        _redis_client = client
        logger.info("[ai-cache] redis connected")
        return _redis_client
    except Exception as exc:  # pragma: no cover - depends on runtime infra
        logger.warning("[ai-cache] redis unavailable, using memory cache only: %s", exc)
        _redis_client = None
        return None


def _redis_get_json(key: str) -> dict[str, Any] | None:
    client = _redis()
    if client is None:
        return None
    try:
        raw = client.get(key)
        return json.loads(raw) if raw else None
    except Exception as exc:  # pragma: no cover - depends on runtime infra
        logger.warning("[ai-cache] redis get failed key=%s error=%s", _safe_key_id(key), exc)
        return None


def _redis_set_json(key: str, value: dict[str, Any], ttl_seconds: int) -> None:
    client = _redis()
    if client is None:
        return
    try:
        client.setex(key, ttl_seconds, json.dumps(value, ensure_ascii=False, separators=(",", ":")))
    except Exception as exc:  # pragma: no cover - depends on runtime infra
        logger.warning("[ai-cache] redis set failed key=%s error=%s", _safe_key_id(key), exc)


def _safe_key_id(key: str) -> str:
    return key.rsplit(":", 1)[-1][:12]
