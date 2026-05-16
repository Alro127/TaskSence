"""Compatibility facade for PostgreSQL source-of-truth access.

New code should import from ``app.service.source_truth`` modules. This facade
preserves the historical ``app.service.source_truth_service`` import path.
"""

from app.service.source_truth import (
    count_tasks_exact,
    fetch_projects_for_embedding,
    fetch_tasks_for_embedding,
    hydrate_documents_with_postgres,
    resolve_project_by_name,
)

__all__ = [
    "count_tasks_exact",
    "fetch_projects_for_embedding",
    "fetch_tasks_for_embedding",
    "hydrate_documents_with_postgres",
    "resolve_project_by_name",
]
