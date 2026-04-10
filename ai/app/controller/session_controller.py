"""API controller for chatbot endpoints.

This module exposes documented HTTP endpoints only.
Business logic is delegated to the service layer.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator

from app.auth.dependencies import get_current_user_id
from app.core.response import ResponseObject
from app.service.chatbot_service import run_chatbot_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["chatbot"])


class ChatRequest(BaseModel):
    """Request payload for chatbot endpoint."""

    query: str = Field(..., min_length=1, max_length=1000, description="User question")

    @field_validator("query")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("query must not be blank")
        return stripped


class SourceItem(BaseModel):
    id: str
    index: str
    relation: dict | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceItem]
    sessionId: int | None = None

@router.get(
    "/sessions",
    response_model=ResponseObject[ChatResponse],
    summary="Run AI RAG chatbot",
    description=(
        "Analyze the question, run RAG retrieval against Qdrant, "
        "hydrate with PostgreSQL source-of-truth data, and return an answer."
    ),
)
async def chat(
    request: ChatRequest,
    user_id: int = Depends(get_current_user_id),
) -> ResponseObject[ChatResponse]:
    logger.info(
        "[chatbot-controller] GET /ai/sessions userId=%s",
        user_id,
    )

    try:
        result = run_chatbot_pipeline(
            query=request.query,
            user_id=user_id,
        )
    except Exception as exc:  # pragma: no cover - defensive branch
        logger.exception("[chatbot-controller] service execution failed: %s", exc)
        return ResponseObject[ChatResponse](
            code="ERROR",
            message="Failed to generate chat response",
            data=None,
            errors=[str(exc)],
        )

    return ResponseObject[ChatResponse](
        code="SUCCESS",
        message="Chat response generated successfully",
        data=ChatResponse(
            answer=result["answer"],
            sources=[SourceItem(**source) for source in result["sources"]],
            sessionId=result.get("sessionId"),
        ),
        errors=None,
    )
