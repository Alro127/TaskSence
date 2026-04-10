"""Service layer for chat session and message retrieval."""

from __future__ import annotations

from math import ceil
from typing import Any, cast

from app.config.config import get_settings

settings = get_settings()


def _connect():
	try:
		import psycopg
		from psycopg.rows import dict_row
	except ImportError as exc:  # pragma: no cover - depends on runtime env
		raise RuntimeError("psycopg is required for session operations") from exc

	return psycopg.connect(
		settings.effective_postgres_dsn,
		row_factory=cast(Any, dict_row),
	)


def _total_pages(total_elements: int, size: int) -> int:
	if total_elements == 0:
		return 0
	return ceil(total_elements / size)


def create_chat_session(*, user_id: int, title: str | None = None) -> dict[str, Any]:
	resolved_title = title.strip() if isinstance(title, str) else ""
	if not resolved_title:
		resolved_title = "New chat"

	with _connect() as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				INSERT INTO chat_sessions (user_id, title)
				VALUES (%s, %s)
				RETURNING id, user_id, title, created_at, updated_at
				""",
				(user_id, resolved_title),
			)
			row = cast(dict[str, Any] | None, cur.fetchone())
			conn.commit()

	if row is None:
		raise RuntimeError("Failed to create chat session")

	return {
		**row,
		"message_count": 0,
		"last_message_at": None,
	}


def list_chat_sessions(*, user_id: int, page: int, size: int) -> dict[str, Any]:
	offset = page * size
	with _connect() as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				SELECT COUNT(*) AS total
				FROM chat_sessions s
				WHERE s.user_id = %s AND s.deleted_at IS NULL
				""",
				(user_id,),
			)
			total_row = cast(dict[str, Any] | None, cur.fetchone())
			total_elements = int(total_row["total"]) if total_row is not None else 0

			cur.execute(
				"""
				SELECT
					s.id,
					s.title,
					s.created_at,
					s.updated_at,
					COUNT(m.id)::int AS message_count,
					MAX(m.created_at) AS last_message_at
				FROM chat_sessions s
				LEFT JOIN chat_messages m ON m.session_id = s.id
				WHERE s.user_id = %s AND s.deleted_at IS NULL
				GROUP BY s.id
				ORDER BY s.created_at DESC, s.id DESC
				LIMIT %s OFFSET %s
				""",
				(user_id, size, offset),
			)
			rows = cast(list[dict[str, Any]], cur.fetchall())

	return {
		"data": rows,
		"page": page,
		"size": size,
		"totalElements": total_elements,
		"totalPages": _total_pages(total_elements, size),
	}


def get_chat_session_detail(*, user_id: int, session_id: int) -> dict[str, Any] | None:
	with _connect() as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				SELECT
					s.id,
					s.user_id,
					s.title,
					s.created_at,
					s.updated_at,
					COUNT(m.id)::int AS message_count,
					MAX(m.created_at) AS last_message_at
				FROM chat_sessions s
				LEFT JOIN chat_messages m ON m.session_id = s.id
				WHERE s.id = %s
				  AND s.user_id = %s
				  AND s.deleted_at IS NULL
				GROUP BY s.id
				""",
				(session_id, user_id),
			)
			row = cast(dict[str, Any] | None, cur.fetchone())

	return row


def list_chat_messages_by_session(
	*,
	user_id: int,
	session_id: int,
	page: int,
	size: int,
) -> dict[str, Any] | None:
	offset = page * size

	with _connect() as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				SELECT 1
				FROM chat_sessions s
				WHERE s.id = %s
				  AND s.user_id = %s
				  AND s.deleted_at IS NULL
				""",
				(session_id, user_id),
			)
			owner_check = cur.fetchone()
			if owner_check is None:
				return None

			cur.execute(
				"""
				SELECT COUNT(*) AS total
				FROM chat_messages m
				WHERE m.session_id = %s
				""",
				(session_id,),
			)
			total_row = cast(dict[str, Any] | None, cur.fetchone())
			total_elements = int(total_row["total"]) if total_row is not None else 0

			cur.execute(
				"""
				SELECT
					m.id,
					m.session_id,
					m.role,
					m.content,
					m.context,
					m.sources,
					m.created_at
				FROM chat_messages m
				WHERE m.session_id = %s
				ORDER BY m.created_at DESC, m.id DESC
				LIMIT %s OFFSET %s
				""",
				(session_id, size, offset),
			)
			rows = cast(list[dict[str, Any]], cur.fetchall())

	return {
		"data": rows,
		"page": page,
		"size": size,
		"totalElements": total_elements,
		"totalPages": _total_pages(total_elements, size),
	}


def delete_chat_session(*, user_id: int, session_id: int) -> bool:
	"""Delete one chat session owned by user.

	Messages are deleted automatically by DB cascade constraint.
	"""
	with _connect() as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				DELETE FROM chat_sessions
				WHERE id = %s
				  AND user_id = %s
				  AND deleted_at IS NULL
				RETURNING id
				""",
				(session_id, user_id),
			)
			deleted_row = cur.fetchone()
		conn.commit()

	return deleted_row is not None
