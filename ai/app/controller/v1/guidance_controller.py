"""API controller for project guidance endpoints."""

from __future__ import annotations
import logging
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user_id
from app.core.response import ResponseObject
from app.service.guidance_service import generate_guidance

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/guidance", tags=["guidance"])


class WorkflowStepContext(BaseModel):
    title: str
    description: str | None = None
    position: int


class GuidanceGenerationRequest(BaseModel):
    workflowId: int
    name: str
    description: str | None = None
    projectName: str | None = None
    steps: list[WorkflowStepContext]


@router.post(
    "/generate",
    response_model=ResponseObject[dict[str, Any]],
    summary="Generate structured guidance for a workflow",
)
async def generate(
    request: GuidanceGenerationRequest,
    user_id: int = Depends(get_current_user_id),
) -> ResponseObject[dict[str, Any]]:
    logger.info(
        "[guidance-controller] POST /ai/guidance/generate userId=%s workflowId=%s",
        user_id,
        request.workflowId,
    )
    try:
        result = generate_guidance(
            workflow_id=request.workflowId,
            name=request.name,
            description=request.description,
            project_name=request.projectName,
            steps=[step.model_dump() for step in request.steps],
        )
        return ResponseObject[dict[str, Any]](
            code="SUCCESS",
            message="Guidance generated successfully",
            data=result,
            errors=None,
        )
    except Exception as exc:
        logger.exception("[guidance-controller] generation failed: %s", exc)
        return ResponseObject[dict[str, Any]](
            code="ERROR",
            message="Failed to generate guidance",
            data=None,
            errors=[str(exc)],
        )
