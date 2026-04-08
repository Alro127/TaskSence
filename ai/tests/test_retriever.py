"""
Tests for app.chatbot.components.retriever

Strategy
--------
- Elasticsearch client is fully mocked — no running ES instance required.
- _has_dense_vector cache is cleared before each test to avoid cross-test pollution.
- Tests cover: keyword search (tasks & projects), vector search path,
  ownership filter structure, hit parsing, workspace_id gating,
  empty-query early return, and result sorting by score.
"""

from unittest.mock import MagicMock, patch

import pytest

import app.chatbot.components.retriever as retriever_module
from app.chatbot.components.retriever import (
    _has_dense_vector,
    _parse_hits,
    _task_user_filter,
    retrieve,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _es_response(*hits: dict) -> dict:
    """Build a minimal Elasticsearch search response from a list of hit dicts."""
    return {"hits": {"hits": list(hits)}}


def _hit(doc_id: str, score: float, source: dict) -> dict:
    return {"_id": doc_id, "_score": score, "_source": source}


@pytest.fixture(autouse=True)
def clear_lru_caches():
    """Clear all lru_cache-decorated functions before each test."""
    _has_dense_vector.cache_clear()
    retriever_module._get_client.cache_clear()
    yield


@pytest.fixture
def mock_es():
    """Patch _get_client to return a MagicMock ES client."""
    es = MagicMock()
    with patch("app.chatbot.components.retriever._get_client", return_value=es):
        yield es


# ── _parse_hits ───────────────────────────────────────────────────────────────

class TestParseHits:
    def test_parses_id_index_score_source(self):
        response = _es_response(_hit("42", 1.5, {"title": "Fix bug"}))
        docs = _parse_hits(response, "tasks")
        assert len(docs) == 1
        assert docs[0]["id"] == "42"
        assert docs[0]["index"] == "tasks"
        assert docs[0]["score"] == 1.5
        assert docs[0]["source"] == {"title": "Fix bug"}

    def test_none_score_defaults_to_zero(self):
        hit = {"_id": "1", "_score": None, "_source": {}}
        docs = _parse_hits({"hits": {"hits": [hit]}}, "tasks")
        assert docs[0]["score"] == 0.0

    def test_empty_response_returns_empty_list(self):
        assert _parse_hits({"hits": {"hits": []}}, "tasks") == []

    def test_multiple_hits_preserved(self):
        response = _es_response(
            _hit("1", 2.0, {"title": "A"}),
            _hit("2", 1.0, {"title": "B"}),
        )
        docs = _parse_hits(response, "projects")
        assert len(docs) == 2
        assert docs[0]["id"] == "1"
        assert docs[1]["id"] == "2"


# ── _task_user_filter ─────────────────────────────────────────────────────────

class TestTaskUserFilter:
    def test_filter_structure(self):
        f = _task_user_filter(7)
        assert f["bool"]["minimum_should_match"] == 1
        should = f["bool"]["should"]
        assert {"term": {"createdById": 7}} in should

    def test_nested_assignee_clause_present(self):
        should = _task_user_filter(7)["bool"]["should"]
        nested = next(c for c in should if "nested" in c)
        assert nested["nested"]["path"] == "assignees"
        assert nested["nested"]["query"] == {"term": {"assignees.id": 7}}

    def test_different_user_ids(self):
        f1 = _task_user_filter(1)
        f2 = _task_user_filter(99)
        assert f1 != f2


# ── _has_dense_vector ─────────────────────────────────────────────────────────

class TestHasDenseVector:
    def test_returns_true_when_dense_vector_field_exists(self, mock_es):
        mock_es.indices.get_mapping.return_value = {
            "tasks": {"mappings": {"properties": {"embedding": {"type": "dense_vector"}}}}
        }
        assert _has_dense_vector("tasks") is True

    def test_returns_false_when_no_dense_vector_field(self, mock_es):
        mock_es.indices.get_mapping.return_value = {
            "tasks": {"mappings": {"properties": {"title": {"type": "text"}}}}
        }
        assert _has_dense_vector("tasks") is False

    def test_returns_false_on_es_exception(self, mock_es):
        mock_es.indices.get_mapping.side_effect = Exception("connection refused")
        assert _has_dense_vector("tasks") is False

    def test_result_is_cached(self, mock_es):
        mock_es.indices.get_mapping.return_value = {
            "tasks": {"mappings": {"properties": {}}}
        }
        _has_dense_vector("tasks")
        _has_dense_vector("tasks")
        # Mapping should only be fetched once due to lru_cache
        mock_es.indices.get_mapping.assert_called_once()


# ── retrieve — keyword search ─────────────────────────────────────────────────

class TestRetrieveKeyword:
    def test_tasks_searched_with_user_filter(self, mock_es):
        mock_es.indices.get_mapping.return_value = {
            "tasks": {"mappings": {"properties": {"title": {"type": "text"}}}}
        }
        mock_es.search.return_value = _es_response(_hit("1", 1.0, {"title": "Fix login"}))

        docs = retrieve("login bug", user_id=5)

        call_kwargs = mock_es.search.call_args.kwargs
        assert call_kwargs["index"] == "tasks"
        query_body = call_kwargs["query"]
        assert query_body["bool"]["filter"][0]["bool"]["minimum_should_match"] == 1

    def test_returns_documents_from_tasks(self, mock_es):
        mock_es.indices.get_mapping.return_value = {
            "tasks": {"mappings": {"properties": {}}}
        }
        mock_es.search.return_value = _es_response(
            _hit("10", 2.0, {"title": "Task A"}),
            _hit("11", 1.0, {"title": "Task B"}),
        )

        docs = retrieve("overdue tasks", user_id=1)
        assert len(docs) == 2
        assert all(d["index"] == "tasks" for d in docs)

    def test_no_workspace_id_skips_project_search(self, mock_es):
        mock_es.indices.get_mapping.return_value = {
            "tasks": {"mappings": {"properties": {}}}
        }
        mock_es.search.return_value = _es_response()

        retrieve("some query", user_id=1, workspace_id=None)

        # ES search called only once (for tasks)
        assert mock_es.search.call_count == 1

    def test_with_workspace_id_searches_both_indices(self, mock_es):
        mock_es.indices.get_mapping.return_value = {
            "tasks":    {"mappings": {"properties": {}}},
            "projects": {"mappings": {"properties": {}}},
        }
        mock_es.search.return_value = _es_response()

        retrieve("overdue", user_id=1, workspace_id=42)

        assert mock_es.search.call_count == 2
        indices_searched = [c.kwargs["index"] for c in mock_es.search.call_args_list]
        assert "tasks" in indices_searched
        assert "projects" in indices_searched

    def test_project_search_uses_workspace_filter(self, mock_es):
        mock_es.indices.get_mapping.return_value = {
            "tasks":    {"mappings": {"properties": {}}},
            "projects": {"mappings": {"properties": {}}},
        }
        mock_es.search.return_value = _es_response()

        retrieve("late project", user_id=1, workspace_id=99)

        project_call = next(
            c for c in mock_es.search.call_args_list if c.kwargs["index"] == "projects"
        )
        ws_filter = project_call.kwargs["query"]["bool"]["filter"][0]
        assert ws_filter == {"term": {"workspaceId": 99}}


# ── retrieve — vector search path ────────────────────────────────────────────

class TestRetrieveVector:
    def test_uses_knn_when_dense_vector_exists(self, mock_es):
        mock_es.indices.get_mapping.return_value = {
            "tasks": {"mappings": {"properties": {"embedding": {"type": "dense_vector"}}}}
        }
        mock_es.search.return_value = _es_response()

        fake_vector = [0.1] * 768
        with patch("app.chatbot.components.retriever._embed_query", return_value=fake_vector):
            retrieve("overdue tasks", user_id=1)

        call_kwargs = mock_es.search.call_args.kwargs
        assert "knn" in call_kwargs
        assert call_kwargs["knn"]["field"] == "embedding"
        assert call_kwargs["knn"]["query_vector"] == fake_vector
        assert call_kwargs["knn"]["k"] == 5


# ── retrieve — result ordering ────────────────────────────────────────────────

class TestRetrieveSorting:
    def test_results_sorted_by_score_descending(self, mock_es):
        mock_es.indices.get_mapping.return_value = {
            "tasks":    {"mappings": {"properties": {}}},
            "projects": {"mappings": {"properties": {}}},
        }
        # tasks returns lower score, projects returns higher score
        def _side_effect(**kwargs):
            if kwargs["index"] == "tasks":
                return _es_response(_hit("t1", 0.5, {}))
            return _es_response(_hit("p1", 2.0, {}))

        mock_es.search.side_effect = _side_effect

        docs = retrieve("query", user_id=1, workspace_id=10)
        assert docs[0]["score"] == 2.0
        assert docs[1]["score"] == 0.5


# ── retrieve — empty query early return ──────────────────────────────────────

class TestRetrieveEmptyQuery:
    def test_blank_query_returns_none(self, mock_es):
        result = retrieve("   ", user_id=1)
        assert result is None
        mock_es.search.assert_not_called()

    def test_empty_string_returns_none(self, mock_es):
        result = retrieve("", user_id=1)
        assert result is None
