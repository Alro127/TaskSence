"""Persistence helpers for AI chat sessions and messages."""

from __future__ import annotations

import logging
from typing import Any

from app.chatbot.components import Document
from app.config.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _connect():
    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError as exc:  # pragma: no cover - depends on runtime env
        raise RuntimeError(
            "psycopg is required for chat persistence operations"
        ) from exc

    return psycopg.connect(settings.effective_postgres_dsn, row_factory=dict_row)


def _build_session_title(query: str) -> str:
    title = " ".join(query.strip().split())
    if len(title) > 120:
        return title[:117] + "..."
    return title or "Chat session"


def _serialize_documents(docs: list[Document]) -> list[dict[str, Any]]:
    return [
        {
            "id": doc["id"],
            "index": doc["index"],
            "score": doc["score"],
            "source": doc["source"],
        }
        for doc in docs
    ]


def persist_chat_turn(
    user_id: int,
    query: str,
    answer: str,
    context_docs: list[Document],
    sources: list[dict[str, Any]],
    session_id: int | None = None,
) -> int | None:
    """Store a user question and assistant answer in the shared PostgreSQL tables."""
    session_title = _build_session_title(query)
    context_payload = _serialize_documents(context_docs)

    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                resolved_session_id: int | None = session_id
                if resolved_session_id is not None:
                    cur.execute(
                        """
                        SELECT id
                        FROM chat_sessions
                        WHERE id = %s AND user_id = %s AND deleted_at IS NULL
                        """,
                        (resolved_session_id, user_id),
                    )
                    existing_session = cur.fetchone()
                    if existing_session is None:
                        resolved_session_id = None

                if resolved_session_id is None:
                    cur.execute(
                        """
                        INSERT INTO chat_sessions (user_id, title)
                        VALUES (%s, %s)
                        RETURNING id
                        """,
                        (user_id, session_title),
                    )
                    session_row = cur.fetchone()
                    resolved_session_id = int(session_row["id"])

                cur.execute(
                    """
                    INSERT INTO chat_messages (session_id, role, content, context, sources)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (resolved_session_id, "USER", query, None, None),
                )
                cur.execute(
                    """
                    INSERT INTO chat_messages (session_id, role, content, context, sources)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (resolved_session_id, "ASSISTANT", answer, context_payload, sources),
                )
                cur.execute(
                    """
                    UPDATE chat_sessions
                    SET title = COALESCE(title, %s), updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (session_title, resolved_session_id),
                )
            conn.commit()
        logger.info(
            "[chat-persistence] stored chat session=%s user_id=%s messages=2",
            resolved_session_id,
            user_id,
        )
        return resolved_session_id
    except Exception as exc:
        logger.warning("[chat-persistence] persist_chat_turn failed: %s", exc)
        return None
