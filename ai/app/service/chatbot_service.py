"""Chatbot service that orchestrates RAG components and source-of-truth hydration."""

from __future__ import annotations

import logging
from typing import Any

from app.chatbot.components import Document
from app.chatbot.components.classifier import classify
from app.chatbot.components.filter import filter_docs
from app.chatbot.components.generator import generate
from app.chatbot.components.retriever import retrieve
from app.chatbot.components.rewriter import rewrite
from app.service.chat_persistence_service import persist_chat_turn
from app.service.source_truth_service import count_tasks_exact, hydrate_documents_with_postgres

logger = logging.getLogger(__name__)

_MSG_UNRELATED = "Chi ho tro cau hoi lien quan den task/project."
_MSG_NO_DATA = "Khong tim thay du lieu phu hop."
_MSG_ERROR = "He thong AI dang gap loi."


def run_chatbot_pipeline(
    query: str,
    user_id: int,
    session_id: int | None = None,
) -> dict[str, Any]:
    """Execute full chatbot pipeline from classification to grounded answer."""
    logger.info(
        "[chatbot-service] start user_id=%s query=%r",
        user_id,
        query,
    )

    try:
        classification = classify(query)
        if not classification.get("is_relevant"):
            session_id = persist_chat_turn(
                user_id=user_id,
                query=query,
                answer=_MSG_UNRELATED,
                context_docs=[],
                sources=[],
                session_id=session_id,
            )
            return _response(_MSG_UNRELATED, [], session_id)

        is_personal = bool(classification.get("is_personal", False))
        intent = str(classification.get("intent", "task_query"))

        rewritten = rewrite(query)
        primary_query = rewritten[0] if rewritten else query

        if intent == "count_query":
            total = count_tasks_exact(
                query=primary_query,
                user_id=user_id,
                workspace_id=None,
                project_id=None,
                is_personal=is_personal,
            )
            count_doc = Document(
                id="count_0",
                index="count_result",
                score=1.0,
                source={"count": total, "context": primary_query},
            )
            answer = generate(query, [count_doc])
            session_id = persist_chat_turn(
                user_id=user_id,
                query=query,
                answer=answer,
                context_docs=[count_doc],
                sources=[],
                session_id=session_id,
            )
            return _response(answer, [], session_id)

        raw_docs: list[Document] = []
        for rewritten_query in rewritten:
            docs = retrieve(
                rewritten_query,
                user_id=user_id,
                workspace_id=None,
                project_id=None,
                is_personal=is_personal,
            )
            raw_docs.extend(docs)

        context = filter_docs(raw_docs)
        if not context:
            session_id = persist_chat_turn(
                user_id=user_id,
                query=query,
                answer=_MSG_NO_DATA,
                context_docs=[],
                sources=[],
                session_id=session_id,
            )
            return _response(_MSG_NO_DATA, [], session_id)

        hydrated_context = hydrate_documents_with_postgres(context)
        answer = generate(query, hydrated_context)
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
        )
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
