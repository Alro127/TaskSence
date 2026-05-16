"""Source-of-truth PostgreSQL access package."""

from app.service.source_truth.counts import count_tasks_exact
from app.service.source_truth.embedding import fetch_projects_for_embedding, fetch_tasks_for_embedding
from app.service.source_truth.hydration import hydrate_documents_with_postgres
from app.service.source_truth.resolution import resolve_project_by_name

__all__ = [
    "count_tasks_exact",
    "fetch_projects_for_embedding",
    "fetch_tasks_for_embedding",
    "hydrate_documents_with_postgres",
    "resolve_project_by_name",
]
