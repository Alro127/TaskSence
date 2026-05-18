"""Shared PostgreSQL helpers for source-of-truth modules."""

from __future__ import annotations

from typing import Any, cast

from app.config.config import get_settings

settings = get_settings()


def connect():
    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError as exc:  # pragma: no cover - depends on runtime env
        raise RuntimeError(
            "psycopg is required for PostgreSQL source-of-truth operations"
        ) from exc

    return psycopg.connect(
        settings.effective_postgres_dsn,
        row_factory=cast(Any, dict_row),
    )


def as_dict_rows(rows: Any) -> list[dict[str, Any]]:
    return [cast(dict[str, Any], row) for row in rows]
