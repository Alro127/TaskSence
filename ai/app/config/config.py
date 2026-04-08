"""Centralized application settings loaded from environment variables."""

from dataclasses import dataclass
from functools import lru_cache
import os

from dotenv import load_dotenv

load_dotenv()


def _env_str(name: str, default: str) -> str:
	value = os.getenv(name)
	return value if value is not None else default


def _env_int(name: str, default: int) -> int:
	raw = os.getenv(name)
	if raw is None:
		return default
	try:
		return int(raw)
	except ValueError:
		return default


def _env_bool(name: str, default: bool) -> bool:
	raw = os.getenv(name)
	if raw is None:
		return default
	return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_csv(name: str, default: str) -> list[str]:
	raw = os.getenv(name, default)
	return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
	app_name: str
	app_version: str
	app_description: str
	host: str
	port: int
	reload: bool
	cors_origins: list[str]

	llm_provider: str
	openai_api_key: str
	openai_model: str
	gemini_api_key: str
	gemini_model: str
	gemini_embedding_model: str
	openrouter_api_key: str
	openrouter_model: str
	openrouter_embedding_model: str
	openrouter_base_url: str

	qdrant_host: str
	qdrant_collection_tasks: str
	qdrant_collection_projects: str
	qdrant_vector_size: int

	sync_interval_minutes: int
	sync_batch_size: int

	postgres_dsn: str
	postgres_host: str
	postgres_port: int
	postgres_db: str
	postgres_user: str
	postgres_password: str
	postgres_sslmode: str

	@property
	def effective_postgres_dsn(self) -> str:
		if self.postgres_dsn:
			return self.postgres_dsn
		return (
			"dbname={db} user={user} password={password} host={host} "
			"port={port} sslmode={sslmode}"
		).format(
			db=self.postgres_db,
			user=self.postgres_user,
			password=self.postgres_password,
			host=self.postgres_host,
			port=self.postgres_port,
			sslmode=self.postgres_sslmode,
		)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
	return Settings(
		app_name=_env_str("APP_NAME", "TaskSense AI Service"),
		app_version=_env_str("APP_VERSION", "0.1.0"),
		app_description=_env_str(
			"APP_DESCRIPTION",
			"RAG-based chatbot for task and project queries",
		),
		host=_env_str("HOST", "0.0.0.0"),
		port=_env_int("PORT", 8000),
		reload=_env_bool("RELOAD", True),
		cors_origins=_env_csv("CORS_ORIGINS", "*"),
		llm_provider=_env_str("LLM_PROVIDER", "gemini").lower(),
		openai_api_key=_env_str("OPENAI_API_KEY", ""),
		openai_model=_env_str("OPENAI_MODEL", "gpt-4o-mini"),
		gemini_api_key=_env_str("GEMINI_API_KEY", ""),
		gemini_model=_env_str("GEMINI_MODEL", "gemini-2.5-flash"),
		gemini_embedding_model=_env_str(
			"GEMINI_EMBEDDING_MODEL", "models/text-embedding-004"
		),
		openrouter_api_key=_env_str("OPENROUTER_API_KEY", ""),
		openrouter_model=_env_str("OPENROUTER_MODEL", "gpt-4o-mini"),
		openrouter_embedding_model=_env_str(
			"OPENROUTER_EMBEDDING_MODEL", "openai/text-embedding-3-large"
		),
		openrouter_base_url=_env_str(
			"OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
		),
		qdrant_host=_env_str("QDRANT_HOST", "http://localhost:6333"),
		qdrant_collection_tasks=_env_str("QDRANT_COLLECTION_TASKS", "tasks"),
		qdrant_collection_projects=_env_str("QDRANT_COLLECTION_PROJECTS", "projects"),
		qdrant_vector_size=_env_int("QDRANT_VECTOR_SIZE", 3072),
		sync_interval_minutes=_env_int("SYNC_INTERVAL_MINUTES", 60),
		sync_batch_size=_env_int("SYNC_BATCH_SIZE", 50),
		postgres_dsn=_env_str("POSTGRES_DSN", ""),
		postgres_host=_env_str("POSTGRES_HOST", "localhost"),
		postgres_port=_env_int("POSTGRES_PORT", 5432),
		postgres_db=_env_str("POSTGRES_DB", "taskdb"),
		postgres_user=_env_str("POSTGRES_USER", "postgres"),
		postgres_password=_env_str("POSTGRES_PASSWORD", "postgres"),
		postgres_sslmode=_env_str("POSTGRES_SSLMODE", "prefer"),
	)
