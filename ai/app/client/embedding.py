from langchain_core.embeddings import Embeddings
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_google_genai.embeddings import GoogleGenerativeAIEmbeddings
from app.config.config import get_settings
from pydantic import SecretStr
import httpx
import logging
import time

settings = get_settings()
logger = logging.getLogger(__name__)


def _is_retryable_status(status_code: int) -> bool:
    return status_code in {408, 409, 425, 429} or status_code >= 500

class OpenRouterEmbeddings(Embeddings):
    def __init__(
        self,
        api_key: SecretStr,
        model: str,
        base_url: str,
        batch_size: int = 32,
        timeout: float = 60.0,
        max_retries: int = 3,
        retry_backoff_seconds: float = 0.5,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.batch_size = batch_size
        self.timeout = timeout
        self.max_retries = max(1, max_retries)
        self.retry_backoff_seconds = max(0.0, retry_backoff_seconds)
        self._client = httpx.Client(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key.get_secret_value()}",
                "Content-Type": "application/json",
            },
            timeout=self.timeout,
        )

    def _sleep_before_retry(self, attempt: int) -> None:
        if self.retry_backoff_seconds <= 0:
            return
        time.sleep(self.retry_backoff_seconds * (2 ** (attempt - 1)))

    def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        response: httpx.Response | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self._client.post(
                    "/embeddings",
                    json={"model": self.model, "input": texts},
                )
                response.raise_for_status()
                break
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                if attempt >= self.max_retries or not _is_retryable_status(status_code):
                    raise
                logger.warning(
                    "[embedding-client] /embeddings failed with status=%d; retrying attempt=%d/%d",
                    status_code,
                    attempt,
                    self.max_retries,
                )
                self._sleep_before_retry(attempt)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                if attempt >= self.max_retries:
                    raise
                logger.warning(
                    "[embedding-client] /embeddings transport error (%s); retrying attempt=%d/%d",
                    exc.__class__.__name__,
                    attempt,
                    self.max_retries,
                )
                self._sleep_before_retry(attempt)

        if response is None:
            raise RuntimeError("Embeddings request did not return a response")

        payload = response.json()
        data = payload.get("data")
        if not isinstance(data, list) or not data:
            raise ValueError("Embeddings response has no data")
        if len(data) != len(texts):
            raise ValueError(
                "Embeddings response size mismatch "
                f"expected={len(texts)} actual={len(data)}"
            )

        vectors: list[list[float]] = []
        for item in data:
            vector = item.get("embedding") if isinstance(item, dict) else None
            if not isinstance(vector, list) or not vector:
                raise ValueError("Embeddings response item missing vector")
            vectors.append([float(v) for v in vector])
        return vectors

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            if not batch:
                continue
            vectors.extend(self._embed_batch(batch))
        return vectors

    def embed_query(self, text: str) -> list[float]:
        vectors = self._embed_batch([text])
        return vectors[0]


class SiliconFlowEmbeddings(OpenRouterEmbeddings):
    """SiliconFlow exposes an OpenAI-compatible /embeddings endpoint."""

    pass
    

def get_embedding() -> Embeddings:
    provider = settings.llm_embedding_provider
    if "openai" == provider:
        if not settings.openai_api_key or not settings.openai_api_key.get_secret_value():
            raise ValueError("OPENAI_API_KEY is required for embedding sync")
        return OpenAIEmbeddings(
            model=settings.openai_model,
            api_key=settings.openai_api_key
        )
    if "openrouter" == provider:
        if not settings.openrouter_api_key or not settings.openrouter_api_key.get_secret_value():
            raise ValueError("OPENROUTER_API_KEY is required for embedding sync")

        return OpenRouterEmbeddings(
            model=settings.openrouter_embedding_model,
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
        )
    if "siliconflow" == provider:
        if not settings.siliconflow_api_key or not settings.siliconflow_api_key.get_secret_value():
            raise ValueError("SILICONFLOW_API_KEY is required for embedding sync")

        return SiliconFlowEmbeddings(
            model=settings.siliconflow_embedding_model,
            api_key=settings.siliconflow_api_key,
            base_url=settings.siliconflow_base_url,
        )
    elif "gemini" == provider:
        if not settings.gemini_api_key or not settings.gemini_api_key.get_secret_value():
            raise ValueError("GEMINI_API_KEY is required for embedding sync")
        return GoogleGenerativeAIEmbeddings(
            model=settings.gemini_embedding_model,
            api_key=settings.gemini_api_key
        )
    else:
        raise ValueError("This provider is not supported")
