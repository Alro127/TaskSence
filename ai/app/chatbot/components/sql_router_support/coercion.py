"""Parameter coercion for SQL router plans."""

from typing import Any


def coerce_status(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip().upper()
    if normalized in {"TODO", "IN_PROGRESS", "REVIEW", "DONE"}:
        return normalized
    return None


def coerce_project_name_like(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned[:120] if cleaned else None


def coerce_limit(value: Any, default: int = 20) -> int:
    try:
        numeric = int(value)
    except (TypeError, ValueError):
        return default
    return max(1, min(100, numeric))
