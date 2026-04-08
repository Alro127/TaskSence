"""API controller for chatbot endpoints.

This module exposes documented HTTP endpoints only.
Business logic is delegated to the service layer.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.service.chatbot_service import run_chatbot_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["chatbot"])


class ChatRequest(BaseModel):
    """Request payload for chatbot endpoint."""

    query: str = Field(..., min_length=1, max_length=1000, description="User question")
    userId: int = Field(..., gt=0, description="Requesting user id")
    workspaceId: int | None = Field(None, gt=0, description="Optional workspace scope")
    projectId: int | None = Field(None, gt=0, description="Optional project scope")

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


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Run AI RAG chatbot",
    description=(
        "Analyze the question, run RAG retrieval against Qdrant, "
        "hydrate with PostgreSQL source-of-truth data, and return an answer."
    ),
)
async def chat(request: ChatRequest) -> ChatResponse:
    logger.info(
        "[chatbot-controller] POST /ai/chat userId=%s workspaceId=%s projectId=%s",
        request.userId,
        request.workspaceId,
        request.projectId,
    )

    try:
        result = run_chatbot_pipeline(
            query=request.query,
            user_id=request.userId,
            workspace_id=request.workspaceId,
            project_id=request.projectId,
        )
    except Exception as exc:  # pragma: no cover - defensive branch
        logger.exception("[chatbot-controller] service execution failed: %s", exc)
        raise HTTPException(status_code=500, detail="Internal AI service error")

    return ChatResponse(
        answer=result["answer"],
        sources=[SourceItem(**source) for source in result["sources"]],
    )
