from fastapi import APIRouter
from app.controller.v1.chatbot_controller import router as chatbot_router
from app.controller.v1.session_controller import router as session_router
from app.controller.v1.guidance_controller import router as guidance_router

router = APIRouter(prefix= "/api/v1")
router.include_router(chatbot_router)
router.include_router(session_router)
router.include_router(guidance_router)