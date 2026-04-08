"""
TaskSense AI Service entry point.

Start the server:
    python -m app.main
or:
    uvicorn app.main:app --reload
"""

import logging
from contextlib import asynccontextmanager

import uvicorn

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from app.config.config import get_settings  # noqa: E402
from app.controller.chatbot_controller import router as chatbot_router  # noqa: E402
from app.indexer.scheduler import shutdown as scheduler_shutdown  # noqa: E402
from app.indexer.scheduler import start as scheduler_start  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)
settings = get_settings()


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """Start the Qdrant sync scheduler on startup; stop it on shutdown."""
    logger.info(
        "TaskSense AI Service starting — provider=%s, qdrant=%s (chatbot API + sync scheduler)",
        settings.llm_provider,
        settings.qdrant_host,
    )
    scheduler_start()
    yield
    scheduler_shutdown()
    logger.info("TaskSense AI Service shutting down")


# ── Application ───────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot_router)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["ops"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
    )
