"""Tests for app.indexer.sync error propagation behavior."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from app.indexer.sync import sync_all


def test_sync_all_logs_and_reraises_on_failure():
    with patch("app.indexer.sync.sync_embeddings_from_postgres", side_effect=RuntimeError("boom")):
        with patch("app.indexer.sync.logger.exception") as mock_log_exception:
            with pytest.raises(RuntimeError, match="boom"):
                sync_all()

    mock_log_exception.assert_called_once()
