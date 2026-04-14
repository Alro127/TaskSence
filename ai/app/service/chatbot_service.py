"""Chatbot service that orchestrates RAG components and source-of-truth hydration."""

from __future__ import annotations

import logging
from typing import Any

from app.agent import run_action_agent
from app.chatbot.components import Document
from app.chatbot.components.classifier import classify
from app.chatbot.components.filter import filter_docs
from app.chatbot.components.generator import generate
from app.chatbot.components.retriever import retrieve
from app.chatbot.components.rewriter import rewrite
from app.chatbot.components.sql_router import query_postgres_documents
from app.service.chat_persistence_service import persist_chat_turn
from app.service.source_truth_service import count_tasks_exact, hydrate_documents_with_postgres, resolve_project_by_name

logger = logging.getLogger(__name__)

_MSG_UNRELATED = "Chi ho tro cau hoi lien quan den task/project."
_MSG_NO_DATA = "Khong tim thay du lieu phu hop."
_MSG_ERROR = "He thong AI dang gap loi."


def _looks_like_action_request(query: str) -> bool:
    normalized = query.lower()
    action_phrases = [
        "tao task",
        "tạo task",
        "create task",
        "tao project",
        "tạo project",
        "create project",
        "update task",
        "chuyen task",
        "chuyển task",
        "from workflow",
        "tu workflow",
        "từ workflow",
    ]
    return any(phrase in normalized for phrase in action_phrases)


def _extract_project_context(query: str, user_id: int) -> int | None:
    """
    Extract project name from query using LLM and resolve to project ID.

    Uses the LLM to understand the query and extract project name naturally.
    If extraction fails or project not found, returns None to fall back to general search.
    """
    try:
        from app.client.llms import get_llm

        llm = get_llm()

        extraction_prompt = f"""Analyze this user query and extract the project name if mentioned.

Query: "{query}"

If the query mentions a project (e.g., "dự án <name>", "project <name>", "trong dự án <name>"), extract and return ONLY the project name.
If no project is mentioned, return "NONE".

Return format: Just the project name or "NONE", nothing else."""

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

        # Check for "NONE" or "none" response
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
        else:
            logger.info("[chatbot-service] project not found or not accessible: %r (will use general search)", project_name)
            return None

    except Exception as exc:
        logger.warning("[chatbot-service] project extraction failed: %s (will use general search)", exc)
        return None


def _get_conversation_history(session_id: int | None) -> str:
    """Fetch recent conversation history from the session for context."""
    if session_id is None:
        return ""

    try:
        import psycopg
        from app.config.config import get_settings

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

        history_lines = []
        for role, content in rows:
            label = "User" if role == "USER" else "Assistant"
            # Truncate long messages
            truncated = content[:200] + "..." if len(content) > 200 else content
            history_lines.append(f"{label}: {truncated}")

        return "\n".join(history_lines)
    except Exception as exc:
        logger.debug("[chatbot-service] Failed to fetch conversation history: %s", exc)
        return ""


def run_chatbot_pipeline(
    query: str,
    user_id: int,
    session_id: int | None = None,
) -> dict[str, Any]:
    """Execute full chatbot pipeline from classification to grounded answer."""
    logger.info(
        "[chatbot-service] start user_id=%s session_id=%s query=%r",
        user_id,
        session_id,
        query,
    )

    is_new_session = session_id is None

    conversation_history = _get_conversation_history(session_id)

    try:
        if _looks_like_action_request(query):
            action_result = run_action_agent(query=query, user_id=user_id)
            if action_result.executed:
                action_answer = (
                    f"Da thuc thi hanh dong {action_result.action} qua MCP. "
                    "Neu ban muon, minh co the truy van lai de kiem tra ket qua moi nhat."
                )
                session_id = persist_chat_turn(
                    user_id=user_id,
                    query=query,
                    answer=action_answer,
                    context_docs=[],
                    sources=[],
                    session_id=session_id,
                    is_first_turn=is_new_session,
                )
                return _response(action_answer, [], session_id)

            if action_result.action != "none" and "mcp execution failed" in action_result.message:
                action_answer = (
                    "Minh da nhan yeu cau thao tac nhung MCP server chua thuc thi thanh cong. "
                    "Ban co the thu lai hoac cung cap them thong tin bat buoc cho lenh nay."
                )
                session_id = persist_chat_turn(
                    user_id=user_id,
                    query=query,
                    answer=action_answer,
                    context_docs=[],
                    sources=[],
                    session_id=session_id,
                    is_first_turn=is_new_session,
                )
                return _response(action_answer, [], session_id)

        classification = classify(query)
        if not classification.get("is_relevant"):
            session_id = persist_chat_turn(
                user_id=user_id,
                query=query,
                answer=_MSG_UNRELATED,
                context_docs=[],
                sources=[],
                session_id=session_id,
                is_first_turn=is_new_session,
            )
            return _response(_MSG_UNRELATED, [], session_id)

        is_personal = bool(classification.get("is_personal", False))
        intent = str(classification.get("intent", "task_query"))
        requested_limit = classification.get("requested_limit")

        # Extract project context if mentioned in query
        logger.info("[chatbot-service] attempting to extract project from query")
        project_id = _extract_project_context(query, user_id)
        logger.info(
            "[chatbot-service] classification: intent=%s is_personal=%s requested_limit=%s project_id=%s",
            intent,
            is_personal,
            requested_limit,
            project_id,
        )

        # RAG PIPELINE (vector semantic search approach)
        logger.info("[chatbot-service] executing RAG pipeline")
        rewritten = rewrite(query)
        primary_query = rewritten[0] if rewritten else query

        if intent == "count_query":
            logger.info("[chatbot-service] count_query detected, using exact count")
            total = count_tasks_exact(
                query=primary_query,
                user_id=user_id,
                workspace_id=None,
                project_id=project_id,
                is_personal=is_personal,
            )
            count_doc = Document(
                id="count_0",
                index="count_result",
                score=1.0,
                source={"count": total, "context": primary_query},
            )
            answer = generate(query, [count_doc], conversation_history=conversation_history)
            session_id = persist_chat_turn(
                user_id=user_id,
                query=query,
                answer=answer,
                context_docs=[count_doc],
                sources=[],
                session_id=session_id,
                is_first_turn=is_new_session,
            )
            logger.info("[chatbot-service] chatbot response sent (count_query)")
            return _response(answer, [], session_id)

        logger.info("[chatbot-service] retrieving documents from SQL router and Qdrant (limit=%s)", requested_limit)
        raw_docs: list[Document] = []

        sql_docs = query_postgres_documents(
            query=query,
            user_id=user_id,
            intent=intent,
            is_personal=is_personal,
            requested_limit=requested_limit,
            project_id=project_id,
        )
        if sql_docs:
            logger.info("[chatbot-service] sql-router returned %d docs", len(sql_docs))
            raw_docs.extend(sql_docs)

        for rewritten_query in rewritten:
            docs = retrieve(
                rewritten_query,
                user_id=user_id,
                workspace_id=None,
                project_id=project_id,
                is_personal=is_personal,
                requested_limit=requested_limit,
            )
            raw_docs.extend(docs)

        logger.info("[chatbot-service] raw docs retrieved: %d (before filtering)", len(raw_docs))
        filter_result = filter_docs(
            raw_docs,
            intent=intent,
            requested_limit=requested_limit,
        )

        # Use filtered documents for response
        context = filter_result["documents"]
        logger.info(
            "[chatbot-service] filtered docs: %d returned, %d total available, has_more=%s",
            len(context),
            filter_result["total_available"],
            filter_result["has_more"],
        )

        if not context:
            logger.warning("[chatbot-service] no documents found after filtering")
            session_id = persist_chat_turn(
                user_id=user_id,
                query=query,
                answer=_MSG_NO_DATA,
                context_docs=[],
                sources=[],
                session_id=session_id,
                is_first_turn=is_new_session,
            )
            return _response(_MSG_NO_DATA, [], session_id)

        hydrated_context = hydrate_documents_with_postgres(context)
        logger.info("[chatbot-service] hydrated context: %d documents enriched from postgres", len(hydrated_context))
        answer = generate(query, hydrated_context, conversation_history=conversation_history)
        sources = [
            {"id": d["id"], "index": d["index"], "relation": d["source"].get("relation")}
            for d in hydrated_context
        ]
        session_id = persist_chat_turn(
            user_id=user_id,
            query=query,
            answer=answer,
            context_docs=hydrated_context,
            sources=sources,
            session_id=session_id,
            is_first_turn=is_new_session,
        )
        logger.info("[chatbot-service] chatbot response sent (sources=%d)", len(sources))
        return _response(answer, sources, session_id)

    except Exception as exc:
        logger.exception("[chatbot-service] unhandled error: %s", exc)
        return _response(_MSG_ERROR, [])


def _response(
    answer: str,
    sources: list[dict[str, Any]],
    session_id: int | None = None,
) -> dict[str, Any]:
    return {"answer": answer, "sources": sources, "sessionId": session_id}
