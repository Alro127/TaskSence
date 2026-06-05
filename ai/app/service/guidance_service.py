"""Service for generating structured project guidance using LLM."""

import logging
from pathlib import Path
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.client.llms import get_llm, parse_llm_json

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "guidance.txt"

def generate_guidance(
    workflow_id: int,
    name: str,
    description: str | None,
    project_name: str | None,
    steps: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Generate structured guidance JSON for a given workflow.
    """
    logger.info("[guidance-service] generating guidance for workflow_id=%d", workflow_id)
    
    template = _PROMPT_PATH.read_text(encoding="utf-8")
    
    steps_context = ""
    for s in steps:
        steps_context += f"- Position {s.get('position')}: {s.get('title')} ({s.get('description', 'No description')})\n"
        
    prompt = template.format(
        projectName=project_name or "Unknown Project",
        workflowName=name,
        workflowDescription=description or "No description provided.",
        workflowSteps=steps_context
    )
    
    llm = get_llm()
    messages = [
        SystemMessage(content="You are a helpful project management assistant."),
        HumanMessage(content=prompt)
    ]
    
    response = llm.invoke(messages)
    content = response.content # type: ignore
    
    try:
        guidance = parse_llm_json(content)
        logger.info("[guidance-service] successfully generated guidance for workflow_id=%d", workflow_id)
        return guidance
    except Exception as exc:
        logger.error("[guidance-service] failed to parse LLM response for workflow_id=%d: %s", workflow_id, exc)
        logger.debug("[guidance-service] raw response: %r", content)
        raise ValueError(f"AI generated invalid guidance format: {exc}") from exc
