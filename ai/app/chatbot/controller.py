"""Backward-compatible export for chatbot controller.

Prefer importing router from app.controller.chatbot_controller.
"""

from app.controller.v1.chatbot_controller import router

__all__ = ["router"]
