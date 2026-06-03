"""Tests for exact AI response cache policy and behavior."""

from __future__ import annotations

from app.service.ai_cache_service import (
    build_chat_cache_key,
    get_cached_chat_response,
    is_cacheable_query,
    set_cached_chat_response,
)


def test_cache_key_does_not_contain_raw_query_or_user_id():
    key = build_chat_cache_key("List my tasks in Project Atlas", user_id=42, agent=False)

    assert "Project Atlas" not in key
    assert ":42:" not in key
    assert key.startswith("tasksense:ai:chat:exact:")


def test_exact_cache_round_trips_response_from_memory():
    key = build_chat_cache_key("How many tasks are in Atlas?", user_id=1, agent=False)
    set_cached_chat_response(
        key,
        {
            "answer": "Atlas has 3 tasks.",
            "sources": [{"id": "count_0", "index": "count_result", "relation": None}],
        },
    )

    cached = get_cached_chat_response(key)

    assert cached is not None
    assert cached.answer == "Atlas has 3 tasks."
    assert cached.sources[0]["id"] == "count_0"


def test_cache_policy_rejects_sensitive_or_contextual_queries():
    assert not is_cacheable_query("What is my password reset token?")
    assert not is_cacheable_query("What about that project above?")
    assert not is_cacheable_query("Show current tasks today")
    assert is_cacheable_query("List tasks in Project Atlas")
