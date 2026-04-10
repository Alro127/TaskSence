"""Backward-compatible pipeline facade.

Prefer using app.service.chatbot_service.run_chatbot_pipeline.
"""

from typing import Any

from app.service.chatbot_service import run_chatbot_pipeline


def run_pipeline(
    query: str,
    user_id: int,
) -> dict[str, Any]:
    return run_chatbot_pipeline(
        query=query,
        user_id=user_id,
    )
