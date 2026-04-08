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
from app.service.source_truth_service import count_tasks_exact, hydrate_documents_with_postgres

logger = logging.getLogger(__name__)

_MSG_UNRELATED = "Chi ho tro cau hoi lien quan den task/project."
_MSG_NO_DATA = "Khong tim thay du lieu phu hop."
_MSG_ERROR = "He thong AI dang gap loi."


def run_chatbot_pipeline(
    query: str,
    user_id: int,
    workspace_id: int | None = None,
    project_id: int | None = None,
) -> dict[str, Any]:
    """Execute full chatbot pipeline from classification to grounded answer."""
    logger.info(
        "[chatbot-service] start user_id=%s workspace_id=%s project_id=%s query=%r",
        user_id,
        workspace_id,
        project_id,
        query,
    )

    try:
        classification = classify(query)
        if not classification.get("is_relevant"):
            return _response(_MSG_UNRELATED, [])

        is_personal = bool(classification.get("is_personal", False))
        intent = str(classification.get("intent", "task_query"))

        rewritten = rewrite(query)
        primary_query = rewritten[0] if rewritten else query

        if intent == "count_query":
            total = count_tasks_exact(
                query=primary_query,
                user_id=user_id,
                workspace_id=workspace_id,
                project_id=project_id,
                is_personal=is_personal,
            )
            count_doc = Document(
                id="count_0",
                index="count_result",
                score=1.0,
                source={"count": total, "context": primary_query},
            )
            answer = generate(query, [count_doc])
            return _response(answer, [])

        raw_docs: list[Document] = []
        for rewritten_query in rewritten:
            docs = retrieve(
                rewritten_query,
                user_id=user_id,
                workspace_id=workspace_id,
                project_id=project_id,
                is_personal=is_personal,
            )
            raw_docs.extend(docs)

        context = filter_docs(raw_docs)
        if not context:
            return _response(_MSG_NO_DATA, [])

        hydrated_context = hydrate_documents_with_postgres(context)
        answer = generate(query, hydrated_context)
        sources = [
            {"id": d["id"], "index": d["index"], "relation": d["source"].get("relation")}
            for d in hydrated_context
        ]
        return _response(answer, sources)

    except Exception as exc:
        logger.exception("[chatbot-service] unhandled error: %s", exc)
        return _response(_MSG_ERROR, [])


def _response(answer: str, sources: list[dict[str, Any]]) -> dict[str, Any]:
    return {"answer": answer, "sources": sources}
