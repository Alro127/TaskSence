"""
Scheduler — runs sync_all() on a background thread at a configurable interval.

Env vars
--------
SYNC_INTERVAL_MINUTES   How often to re-sync (default 1).
                        Set to 0 to disable the recurring job (run once on startup only).
"""

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.config.config import get_settings
from app.indexer.sync import sync_all

logger = logging.getLogger(__name__)
settings = get_settings()

_scheduler = BackgroundScheduler(timezone="UTC")


def start() -> None:
    """
    Start the background scheduler.

    Always triggers an immediate first sync (next_run_time=now) so that
    Qdrant is populated before the first user query arrives.
    If SYNC_INTERVAL_MINUTES > 0 the job also repeats on that cadence.
    """
    interval = settings.sync_interval_minutes

    _scheduler.add_job(
        sync_all,
        trigger="interval",
        minutes=max(interval, 1),      # APScheduler requires interval >= 1
        id="qdrant_sync",
        next_run_time=datetime.now(timezone.utc),  # fire immediately on startup
        misfire_grace_time=300,        # tolerate up to 5-min delay before skipping
        coalesce=True,                 # if multiple fires are missed, run only once
    )

    _scheduler.start()
    logger.info(
        "[scheduler] Qdrant sync started — interval=%d min, first run: immediate",
        interval,
    )


def shutdown() -> None:
    """Stop the scheduler gracefully (does not wait for a running job to finish)."""
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[scheduler] stopped")
