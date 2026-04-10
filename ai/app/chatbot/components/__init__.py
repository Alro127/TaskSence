"""
Shared types for chatbot pipeline components.
"""

from typing import Any, TypedDict


class Document(TypedDict):
    """
    Normalized Qdrant point passed between all pipeline components.

    Fields:
        id:     Point ID from Qdrant (as string).
        index:  Source collection name ("tasks" | "projects").
        score:  Relevance score assigned by Qdrant.
        source: Raw payload from the Qdrant point.
    """

    id: str
    index: str
    score: float
    source: dict[str, Any]
