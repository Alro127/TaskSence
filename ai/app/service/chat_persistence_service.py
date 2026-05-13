"""Persistence helpers for AI chat sessions and messages."""

from __future__ import annotations

import json
import logging
from typing import Any, cast

from app.chatbot.components import Document
from app.config.config import get_settings
from app.client.llms import get_llm

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

    return psycopg.connect(
        settings.effective_postgres_dsn,
        row_factory=cast(Any, dict_row),
    )


def _coerce_content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(str(item) for item in content)
    return str(content)


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


def _generate_title_from_answer(query: str, answer: str) -> str:
    """Generate a short title using AI from the first Q&A pair.

    Fallback to query-based title if AI generation fails.
    """
    try:
        llm = get_llm()
        prompt = f"""Generate a very short chat session title (max 10 words) from this Q&A. Be concise.

User: {query}
Assistant: {answer}

Reply with ONLY the title, no quotes or explanation."""

        response = llm.invoke(prompt)
        title = _coerce_content_to_text(response.content).strip()

        # Ensure it's not too long
        if len(title) > 120:
            return title[:117] + "..."
        return title if title else _build_session_title(query)
    except Exception as exc:
        logger.debug("[chat-persistence] AI title generation failed: %s, falling back to query", exc)
        return _build_session_title(query)


def persist_chat_turn(
    user_id: int,
    query: str,
    answer: str,
    context_docs: list[Document],
    sources: list[dict[str, Any]],
    session_id: int | None = None,
    is_first_turn: bool = False,
    extra_context: dict[str, Any] | None = None,
) -> int | None:
    """Store a user question and assistant answer in the shared PostgreSQL tables.

    Args:
        user_id: User making the query
        query: Original user query
        answer: AI-generated answer
        context_docs: Documents used for context from RAG retrieval
        sources: Source metadata
        session_id: Existing session ID (creates new if None)
        is_first_turn: Whether to generate AI title

    If is_first_turn is True, generates a title from the answer using AI (with fallback to query).
    """
    session_title = _build_session_title(query)
    serialized_documents = _serialize_documents(context_docs)
    context_payload: Any = serialized_documents
    if extra_context:
        context_payload = {"documents": serialized_documents, **extra_context}

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
                    session_row = cast(dict[str, Any] | None, cur.fetchone())
                    if session_row is None:
                        raise RuntimeError("Failed to create chat session")
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
                    (resolved_session_id, "ASSISTANT", answer, json.dumps(context_payload), json.dumps(sources)),
                )

                # If this is the first turn, generate an AI title
                final_title = session_title
                if is_first_turn:
                    final_title = _generate_title_from_answer(query, answer)

                cur.execute(
                    """
                    UPDATE chat_sessions
                    SET title = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (final_title, resolved_session_id),
                )
            conn.commit()
        logger.info(
            "[chat-persistence] stored chat session=%s user_id=%s messages=2 title=%r",
            resolved_session_id,
            user_id,
            final_title,
        )
        return resolved_session_id
    except Exception as exc:
        logger.warning("[chat-persistence] persist_chat_turn failed: %s", exc)
        return None
