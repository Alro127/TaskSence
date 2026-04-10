"""API controller for chat session management endpoints."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Path, Query
from pydantic import BaseModel

from app.auth.dependencies import get_current_user_id
from app.core.response import ResponseObject
from app.service.session_service import (
    delete_chat_session,
    get_chat_session_detail,
    list_chat_messages_by_session,
    list_chat_sessions,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["session"])


class SessionItem(BaseModel):
    id: int
    title: str | None = None
    created_at: datetime
    updated_at: datetime
    message_count: int
    last_message_at: datetime | None = None


class SessionDetail(BaseModel):
    id: int
    user_id: int
    title: str | None = None
    created_at: datetime
    updated_at: datetime
    message_count: int
    last_message_at: datetime | None = None


class MessageItem(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    context: Any | None = None
    sources: Any | None = None
    created_at: datetime


class SessionPageResponse(BaseModel):
    data: list[SessionItem]
    page: int
    size: int
    totalElements: int
    totalPages: int


class MessagePageResponse(BaseModel):
    data: list[MessageItem]
    page: int
    size: int
    totalElements: int
    totalPages: int


class DeleteSessionResponse(BaseModel):
    session_id: int

@router.get(
    "/",
    response_model=ResponseObject[SessionPageResponse],
    summary="List user chat sessions",
    description="Return all chat sessions for the authenticated user with pagination, newest first.",
)
async def get_sessions(
    page: int = Query(default=0, ge=0),
    size: int = Query(default=20, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
) -> ResponseObject[SessionPageResponse]:
    logger.info(
        "[session-controller] GET /ai/sessions userId=%s page=%s size=%s",
        user_id,
        page,
        size,
    )

    payload = list_chat_sessions(user_id=user_id, page=page, size=size)
    return ResponseObject[SessionPageResponse](
        code="SUCCESS",
        message="Chat sessions fetched successfully",
        data=SessionPageResponse(**payload),
        errors=None,
    )


@router.get(
    "/{session_id}",
    response_model=ResponseObject[SessionDetail],
    summary="Get chat session detail",
    description="Return detail of one chat session if it belongs to the authenticated user.",
)
async def get_session_detail(
    session_id: int = Path(..., ge=1),
    user_id: int = Depends(get_current_user_id),
) -> ResponseObject[SessionDetail]:
    logger.info(
        "[session-controller] GET /ai/sessions/%s userId=%s",
        session_id,
        user_id,
    )

    session = get_chat_session_detail(user_id=user_id, session_id=session_id)
    if session is None:
        return ResponseObject[SessionDetail](
            code="NOT_FOUND",
            message="Chat session not found",
            data=None,
            errors=["session_id not found for current user"],
        )

    return ResponseObject[SessionDetail](
        code="SUCCESS",
        message="Chat session fetched successfully",
        data=SessionDetail(**session),
        errors=None,
    )


@router.get(
    "/{session_id}/messages",
    response_model=ResponseObject[MessagePageResponse],
    summary="List chat messages by session",
    description="Return paginated chat messages ordered from newest to oldest.",
)
async def get_session_messages(
    session_id: int = Path(..., ge=1),
    page: int = Query(default=0, ge=0),
    size: int = Query(default=20, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
) -> ResponseObject[MessagePageResponse]:
    logger.info(
        "[session-controller] GET /ai/sessions/%s/messages userId=%s page=%s size=%s",
        session_id,
        user_id,
        page,
        size,
    )

    payload = list_chat_messages_by_session(
        user_id=user_id,
        session_id=session_id,
        page=page,
        size=size,
    )
    if payload is None:
        return ResponseObject[MessagePageResponse](
            code="NOT_FOUND",
            message="Chat session not found",
            data=None,
            errors=["session_id not found for current user"],
        )

    return ResponseObject[MessagePageResponse](
        code="SUCCESS",
        message="Chat messages fetched successfully",
        data=MessagePageResponse(**payload),
        errors=None,
    )


@router.delete(
    "/{session_id}",
    response_model=ResponseObject[DeleteSessionResponse],
    summary="Delete chat session",
    description="Delete one chat session and all related messages for the authenticated user.",
)
async def delete_session(
    session_id: int = Path(..., ge=1),
    user_id: int = Depends(get_current_user_id),
) -> ResponseObject[DeleteSessionResponse]:
    logger.info(
        "[session-controller] DELETE /ai/sessions/%s userId=%s",
        session_id,
        user_id,
    )

    deleted = delete_chat_session(user_id=user_id, session_id=session_id)
    if not deleted:
        return ResponseObject[DeleteSessionResponse](
            code="NOT_FOUND",
            message="Chat session not found",
            data=None,
            errors=["session_id not found for current user"],
        )

    return ResponseObject[DeleteSessionResponse](
        code="SUCCESS",
        message="Chat session deleted successfully",
        data=DeleteSessionResponse(session_id=session_id),
        errors=None,
    )
