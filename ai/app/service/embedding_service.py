"""Embedding service for PostgreSQL -> Qdrant synchronization."""

from __future__ import annotations

import logging
import uuid
from typing import Any, Callable

from langchain_core.embeddings import Embeddings
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.config.config import get_settings
from app.service.source_truth_service import (
    fetch_projects_for_embedding,
    fetch_tasks_for_embedding,
)
from app.client.embedding import get_embedding
from app.client.qdrant_client import get_qdrant_client

logger = logging.getLogger(__name__)
settings = get_settings()

def _to_point_id(collection: str, entity_id: int) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"tasksense/{collection}/{entity_id}"))


def _build_task_text(source: dict) -> str:
    parts: list[str] = []
    for label, key in [
        ("Title", "title"),
        ("Description", "description"),
        ("Status", "status"),
        ("Priority", "priority"),
        ("Project", "projectName"),
        ("Project status", "projectStatus"),
        ("Project description", "projectDescription"),
        ("Workspace", "workspaceName"),
        ("Workspace status", "workspaceStatus"),
        ("Workspace description", "workspaceDescription"),
        ("Sprint", "sprintName"),
        ("Due date", "dueDate"),
        ("Created by", "createdByName"),
    ]:
        if value := source.get(key):
            parts.append(f"{label}: {value}")

    assignees = [
        assignee.get("fullName", "")
        for assignee in source.get("assignees", [])
        if assignee.get("fullName")
    ]
    if assignees:
        parts.append(f"Assignees: {', '.join(assignees)}")

    tags = [
        tag.get("name", "")
        for tag in source.get("tags", [])
        if tag.get("name")
    ]
    if tags:
        parts.append(f"Tags: {', '.join(tags)}")

    if source.get("workspaceName") and source.get("projectName"):
        parts.append(
            "Relationship: task belongs to project "
            f"{source.get('projectName')} in workspace {source.get('workspaceName')}"
        )

    return "\n".join(parts)


def _build_project_text(source: dict) -> str:
    parts: list[str] = []
    for label, key in [
        ("Name", "name"),
        ("Description", "description"),
        ("Status", "status"),
        ("Workspace", "workspaceName"),
        ("Workspace status", "workspaceStatus"),
        ("Workspace description", "workspaceDescription"),
        ("Start date", "startDate"),
        ("End date", "endDate"),
        ("Total tasks", "totalTasks"),
        ("TODO tasks", "todoTasks"),
        ("IN_PROGRESS tasks", "inProgressTasks"),
        ("REVIEW tasks", "reviewTasks"),
        ("DONE tasks", "doneTasks"),
    ]:
        if value := source.get(key):
            parts.append(f"{label}: {value}")

    members = [
        member.get("fullName", "")
        for member in source.get("members", [])
        if member.get("fullName")
    ]
    if members:
        parts.append(f"Members: {', '.join(members)}")

    if source.get("workspaceName") and source.get("name"):
        parts.append(
            "Relationship: project "
            f"{source.get('name')} belongs to workspace {source.get('workspaceName')}"
        )

    return "\n".join(parts)


def _extract_collection_vector_size(vectors_cfg: Any) -> int | None:
    if vectors_cfg is None:
        return None

    if hasattr(vectors_cfg, "size"):
        return int(vectors_cfg.size)

    if isinstance(vectors_cfg, dict):
        for value in vectors_cfg.values():
            if hasattr(value, "size"):
                return int(value.size)

    return None


def _ensure_collection(qdrant: QdrantClient, name: str, vector_size: int) -> None:
    existing = {collection.name for collection in qdrant.get_collections().collections}
    if name in existing:
        info = qdrant.get_collection(collection_name=name)
        current_size = _extract_collection_vector_size(info.config.params.vectors)
        if current_size == vector_size:
            return

        logger.warning(
            "[embedding-service] collection '%s' vector_size mismatch current=%s target=%d, recreating",
            name,
            current_size,
            vector_size,
        )
        qdrant.delete_collection(collection_name=name)
    else:
        logger.info("[embedding-service] creating collection '%s' vector_size=%d", name, vector_size)

    qdrant.create_collection(
        collection_name=name,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )


def _sync_collection(
    qdrant: QdrantClient,
    embed: Embeddings,
    collection: str,
    fetch_fn: Callable[[int, int], list[dict]],
    text_builder: Callable[[dict], str],
) -> int:
    total = 0
    last_id = 0
    collection_ready = False

    while True:
        rows = fetch_fn(last_id, settings.sync_batch_size)
        if not rows:
            break

        texts = [text_builder(row) for row in rows]
        vectors = embed.embed_documents(texts)
        if not vectors:
            logger.warning("[embedding-service] no vectors returned for collection '%s'", collection)
            break

        if not collection_ready:
            _ensure_collection(qdrant, collection, len(vectors[0]))
            collection_ready = True

        points = [
            PointStruct(
                id=_to_point_id(collection, int(row["entityId"])),
                vector=vector,
                payload=row,
            )
            for row, vector in zip(rows, vectors)
        ]

        qdrant.upsert(collection_name=collection, points=points)
        total += len(points)
        last_id = int(rows[-1]["entityId"])

        logger.info("[embedding-service] %s upserted=%d last_entity_id=%d", collection, total, last_id)

    return total


def sync_embeddings_from_postgres() -> None:
    """Public service API for full embedding sync."""
    logger.info("[embedding-service] starting sync from PostgreSQL to Qdrant")

    qdrant = get_qdrant_client()
    embed = get_embedding()

    task_count = _sync_collection(
        qdrant=qdrant,
        embed=embed,
        collection=settings.qdrant_collection_tasks,
        fetch_fn=fetch_tasks_for_embedding,
        text_builder=_build_task_text,
    )
    project_count = _sync_collection(
        qdrant=qdrant,
        embed=embed,
        collection=settings.qdrant_collection_projects,
        fetch_fn=fetch_projects_for_embedding,
        text_builder=_build_project_text,
    )

    logger.info(
        "[embedding-service] sync completed tasks=%d projects=%d",
        task_count,
        project_count,
    )
