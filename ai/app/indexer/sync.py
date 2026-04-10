"""Scheduler-facing entrypoint for embedding sync jobs."""

import logging

from app.service.embedding_service import sync_embeddings_from_postgres

logger = logging.getLogger(__name__)


def sync_all() -> None:
    """Run full sync from PostgreSQL source-of-truth into Qdrant."""
    try:
        sync_embeddings_from_postgres()
    except Exception:
        logger.exception("[sync] sync failed")
