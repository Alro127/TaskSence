"""API controller for chatbot endpoints.

This module exposes documented HTTP endpoints only.
Business logic is delegated to the service layer.
"""

from __future__ import annotations
from datetime import datetime
from typing import Annotated

from app.core.response import ResponseObject
import logging

from fastapi import APIRouter, Depends, Path, Query
from pydantic import BaseModel, Field, field_validator

from app.auth.dependencies import get_current_user_id
from app.service.chatbot_service import run_chatbot_pipeline
from app.service.session_service import create_chat_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["chatbot"])


class ChatRequest(BaseModel):
    """Request payload for chatbot endpoint."""

    query: str = Field(..., min_length=1, max_length=1000, description="User question")
    agent: bool = Field(default=False, description="Enable action-agent mode")

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


class InitSessionRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class InitSessionResponse(BaseModel):
    id: int
    user_id: int
    title: str | None = None
    created_at: datetime
    updated_at: datetime
    message_count: int
    last_message_at: datetime | None = None


@router.post(
    "/sessions",
    response_model=ResponseObject[InitSessionResponse],
    summary="Initialize new chat session",
)
async def init_session(
    request: InitSessionRequest,
    user_id: int = Depends(get_current_user_id),
) -> ResponseObject[InitSessionResponse]:
    created = create_chat_session(user_id=user_id, title=request.title)
    return ResponseObject[InitSessionResponse](
        code="SUCCESS",
        message="Chat session initialized successfully",
        data=InitSessionResponse(**created),
        errors=None,
    )

@router.post(
    "/chat/{session_id}",
    response_model=ResponseObject[ChatResponse],
    summary="Run AI RAG chatbot",
    description=(
        "Analyze the question, run RAG retrieval against Qdrant, "
        "hydrate with PostgreSQL source-of-truth data, and return an answer."
    ),
)
async def chat(
    request: ChatRequest,
    session_id: Annotated[int, Path(title="The ID of the item to get")],
    user_id: int = Depends(get_current_user_id),
) -> ResponseObject[ChatResponse]:
    logger.info(
        "[chatbot-controller] POST /ai/chat userId=%s agent=%s",
        user_id,
        request.agent,
    )
    try:
        result = run_chatbot_pipeline(
            query=request.query,
            user_id=user_id,
            session_id=session_id,
            agent=request.agent,
        )
    except Exception as exc:
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
