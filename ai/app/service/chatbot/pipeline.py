"""Chatbot pipeline orchestration for RAG and agent execution."""

from __future__ import annotations

import logging
from typing import Any

from app.agent import run_action_agent
from app.chatbot.components import Document
from app.chatbot.components.classifier import classify
from app.chatbot.components.filter import filter_docs
from app.chatbot.components.generator import generate
from app.chatbot.components.context_optimizer import retrieval_limit
from app.chatbot.components.retriever import retrieve
from app.chatbot.components.rewriter import rewrite
from app.chatbot.components.sql_router import query_postgres_documents
from app.service.ai_cache_service import (
    build_chat_cache_key,
    get_cached_chat_response,
    is_cacheable_query,
    set_cached_chat_response,
)
from app.service.chat_persistence_service import persist_chat_turn
from app.service.chatbot.constants import _ACTION_PHRASES, _MSG_ERROR, _MSG_NO_DATA, _MSG_UNRELATED
from app.service.chatbot.helpers import extract_project_context, get_conversation_history, looks_like_action_request
from app.service.source_truth_service import count_tasks_exact, hydrate_documents_with_postgres

logger = logging.getLogger(__name__)


def run_chatbot_pipeline(
    query: str,
    user_id: int,
    session_id: int | None = None,
    agent: bool = False,
    auth_token: str | None = None,
) -> dict[str, Any]:
    """Execute full chatbot pipeline from classification to grounded answer."""
    logger.info(
        "[chatbot-service] start user_id=%s session_id=%s agent=%s query=%r",
        user_id,
        session_id,
        agent,
        query,
    )

    is_new_session = session_id is None
    conversation_history = get_conversation_history(session_id)
    cache_key = None

    if not agent and is_cacheable_query(query):
        cache_key = build_chat_cache_key(query=query, user_id=user_id, agent=False)
        cached = get_cached_chat_response(cache_key)
        if cached is not None:
            session_id = persist_chat_turn(
                user_id=user_id,
                query=query,
                answer=cached.answer,
                context_docs=[],
                sources=cached.sources,
                session_id=session_id,
                is_first_turn=is_new_session,
                extra_context={"cacheHit": True},
            )
            return _response(cached.answer, cached.sources, session_id, cached.reasoning)

    try:
        should_try_action_agent = bool(agent) or looks_like_action_request(query, _ACTION_PHRASES)
        if should_try_action_agent:
            action_result = run_action_agent(query=query, user_id=user_id, auth_token=auth_token)
            action_reasoning = _extract_agent_reasoning(action_result.payload)
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
                    extra_context={"agentReasoning": action_reasoning, "agentAction": action_result.action},
                )
                return _response(action_answer, [], session_id, action_reasoning)

            if action_result.action != "none" and "missing required fields" in action_result.message:
                action_answer = action_result.message
                session_id = persist_chat_turn(
                    user_id=user_id,
                    query=query,
                    answer=action_answer,
                    context_docs=[],
                    sources=[],
                    session_id=session_id,
                    is_first_turn=is_new_session,
                    extra_context={"agentReasoning": action_reasoning, "agentAction": action_result.action},
                )
                return _response(action_answer, [], session_id, action_reasoning)

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
                    extra_context={"agentReasoning": action_reasoning, "agentAction": action_result.action},
                )
                return _response(action_answer, [], session_id, action_reasoning)

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
            response = _response(_MSG_UNRELATED, [], session_id)
            _store_cache_if_allowed(cache_key, response)
            return response

        is_personal = bool(classification.get("is_personal", False))
        intent = str(classification.get("intent", "task_query"))
        requested_limit = classification.get("requested_limit")

        logger.info("[chatbot-service] attempting to extract project from query")
        project_id = extract_project_context(query, user_id)
        logger.info(
            "[chatbot-service] classification: intent=%s is_personal=%s requested_limit=%s project_id=%s",
            intent,
            is_personal,
            requested_limit,
            project_id,
        )

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
            response = _response(answer, [], session_id)
            _store_cache_if_allowed(cache_key, response)
            return response

        qdrant_limit = retrieval_limit(requested_limit, intent=intent)
        logger.info("[chatbot-service] retrieving documents from SQL router and Qdrant (limit=%s)", qdrant_limit)
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
                requested_limit=qdrant_limit,
            )
            raw_docs.extend(docs)

        logger.info("[chatbot-service] raw docs retrieved: %d (before filtering)", len(raw_docs))
        filter_result = filter_docs(
            raw_docs,
            intent=intent,
            requested_limit=requested_limit,
            query=primary_query,
        )

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
            response = _response(_MSG_NO_DATA, [], session_id)
            _store_cache_if_allowed(cache_key, response)
            return response

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
        response = _response(answer, sources, session_id)
        _store_cache_if_allowed(cache_key, response)
        return response

    except Exception as exc:
        logger.exception("[chatbot-service] unhandled error: %s", exc)
        return _response(_MSG_ERROR, [])


def _response(
    answer: str,
    sources: list[dict[str, Any]],
    session_id: int | None = None,
    reasoning: list[str] | None = None,
) -> dict[str, Any]:
    response: dict[str, Any] = {"answer": answer, "sources": sources, "sessionId": session_id}
    if reasoning:
        response["reasoning"] = reasoning
    return response


def _extract_agent_reasoning(payload: dict[str, Any] | None) -> list[str]:
    if not payload:
        return []
    reasoning = payload.get("reasoning")
    if isinstance(reasoning, list):
        return [str(item) for item in reasoning if str(item).strip()]
    return []


def _store_cache_if_allowed(cache_key: str | None, response: dict[str, Any]) -> None:
    if cache_key is None:
        return
    set_cached_chat_response(cache_key, response)
