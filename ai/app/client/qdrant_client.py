from qdrant_client import QdrantClient
from app.config.config import get_settings

settings = get_settings()
def get_qdrant_client() -> QdrantClient:
    return QdrantClient(url=settings.qdrant_host)
