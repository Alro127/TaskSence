"""Helper functions for chatbot orchestration."""

from __future__ import annotations

import logging
from typing import Any

from app.config.config import get_settings
from app.service.source_truth_service import resolve_project_by_name

logger = logging.getLogger(__name__)


def looks_like_action_request(query: str, action_phrases: tuple[str, ...]) -> bool:
    normalized = query.lower()
    return any(phrase in normalized for phrase in action_phrases)


def extract_project_context(query: str, user_id: int) -> int | None:
    """
    Extract project name from query using LLM and resolve to project ID.

    Uses the LLM to understand the query and extract project name naturally.
    If extraction fails or project not found, returns None to fall back to general search.
    """
    try:
        from app.client.llms import get_llm

        llm = get_llm()

        extraction_prompt = f"""Analyze this user query and extract the project name if mentioned.

Query: \"{query}\"

If the query mentions a project (e.g., \"dự án <name>\", \"project <name>\", \"trong dự án <name>\"), extract and return ONLY the project name.
If no project is mentioned, return \"NONE\".

Return format: Just the project name or \"NONE\", nothing else."""

        logger.info("[chatbot-service] extracting project name from query")
        response = llm.invoke(extraction_prompt)
        raw_content = response.content
        if isinstance(raw_content, str):
            project_name = raw_content.strip()
        elif isinstance(raw_content, list):
            project_name = "\n".join(str(item) for item in raw_content).strip()
        else:
            project_name = str(raw_content).strip()

        logger.debug("[chatbot-service] LLM extraction result: %r", project_name)

        # Validate extraction result
        if not project_name:
            logger.debug("[chatbot-service] LLM returned empty response")
            return None

        # Check for "NONE" response
        if project_name.upper() == "NONE":
            logger.debug("[chatbot-service] no project mentioned in query")
            return None

        # Limit project name length to avoid SQL injection
        if len(project_name) > 200:
            logger.warning("[chatbot-service] extracted project name too long: %d chars", len(project_name))
            return None

        logger.info("[chatbot-service] LLM extracted project name: %r", project_name)
        project_id = resolve_project_by_name(project_name, user_id)

        if project_id:
            logger.info("[chatbot-service] resolved project: %r → id=%s", project_name, project_id)
            return project_id

        logger.info(
            "[chatbot-service] project not found or not accessible: %r (will use general search)",
            project_name,
        )
        return None

    except Exception as exc:
        logger.warning("[chatbot-service] project extraction failed: %s (will use general search)", exc)
        return None


def get_conversation_history(session_id: int | None) -> str:
    """Fetch recent conversation history from the session for context."""
    if session_id is None:
        return ""

    try:
        import psycopg

        settings = get_settings()
        with psycopg.connect(settings.effective_postgres_dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT role, content
                    FROM chat_messages
                    WHERE session_id = %s
                    ORDER BY created_at ASC
                    LIMIT 20
                    """,
                    (session_id,),
                )
                rows = cur.fetchall()

        if not rows:
            return ""

        history_lines: list[str] = []
        for role, content in rows:
            label = "User" if role == "USER" else "Assistant"
            truncated = content[:200] + "..." if len(content) > 200 else content
            history_lines.append(f"{label}: {truncated}")

        return "\n".join(history_lines)
    except Exception as exc:
        logger.debug("[chatbot-service] Failed to fetch conversation history: %s", exc)
        return ""
