"""Centralized application settings loaded from environment variables."""

from dataclasses import dataclass
from functools import lru_cache
from pydantic import SecretStr
import os

from dotenv import load_dotenv

load_dotenv()


def _env_str(name: str, default: str) -> str:
	value = os.getenv(name)
	return value if value is not None else default

def _env_secret_str(name: str, default: str) -> SecretStr:
	value = os.getenv(name)
	return SecretStr(value) if value is not None else SecretStr(default)

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
	llm_embedding_provider: str
	openai_api_key: SecretStr
	openai_model: str
	openai_embedding_model: str
	gemini_api_key: SecretStr
	gemini_model: str
	gemini_embedding_model: str
	openrouter_api_key: SecretStr
	openrouter_model: str
	openrouter_embedding_model: str
	openrouter_base_url: str
	siliconflow_api_key: SecretStr
	siliconflow_model: str
	siliconflow_embedding_model: str
	siliconflow_base_url: str
	jwt_secret: str

	qdrant_host: str
	qdrant_collection_tasks: str
	qdrant_collection_projects: str

	sync_interval_minutes: int
	sync_batch_size: int
	enable_sync: bool

	chatbot_max_context_docs: int
	chatbot_max_context_docs_for_list: int
	chatbot_retrieval_top_k: int
	chatbot_context_char_budget: int
	chatbot_history_char_budget: int
	enable_system_prompt: bool

	redis_url: str
	cache_enabled: bool
	cache_read_enabled: bool
	cache_write_enabled: bool
	cache_ttl_seconds: int
	cache_memory_ttl_seconds: int
	cache_memory_max_items: int
	cache_redis_prefix: str
	cache_prompt_version: str

	postgres_dsn: str
	postgres_host: str
	postgres_port: int
	postgres_db: str
	postgres_user: str
	postgres_password: str
	postgres_sslmode: str

	mcp_endpoint: str
	mcp_timeout_seconds: float
	mcp_api_key: SecretStr

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
		cors_origins=_env_csv(
			"CORS_ORIGINS",
			"http://localhost:3000,http://localhost:5173,https://tasksense.app,https://tasksense.io.vn",
		),
		llm_provider=_env_str("LLM_PROVIDER", "gemini").lower(),
		llm_embedding_provider=_env_str("LLM_EMBEDDING_PROVIDER", "openrouter").lower(),
		openai_api_key=_env_secret_str("OPENAI_API_KEY", ""),
		openai_model=_env_str("OPENAI_MODEL", "gpt-4o-mini"),
		openai_embedding_model=_env_str("OPENAI_MODEL", "gpt-4o-mini"),
		gemini_api_key=_env_secret_str("GEMINI_API_KEY", ""),
		gemini_model=_env_str("GEMINI_MODEL", "gemini-2.5-flash"),
		gemini_embedding_model=_env_str(
			"GEMINI_EMBEDDING_MODEL", "models/text-embedding-004"
		),
		openrouter_api_key=_env_secret_str("OPENROUTER_API_KEY", ""),
		openrouter_model=_env_str("OPENROUTER_MODEL", "gpt-4o-mini"),
		openrouter_embedding_model=_env_str(
			"OPENROUTER_EMBEDDING_MODEL", "openai/text-embedding-3-large"
		),
		openrouter_base_url=_env_str(
			"OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
		),
		siliconflow_api_key=_env_secret_str("SILICONFLOW_API_KEY", ""),
		siliconflow_model=_env_str(
			"SILICONFLOW_MODEL", "deepseek-ai/DeepSeek-V3"
		),
		siliconflow_embedding_model=_env_str(
			"SILICONFLOW_EMBEDDING_MODEL", "BAAI/bge-m3"
		),
		siliconflow_base_url=_env_str(
			"SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1"
		),
		jwt_secret=_env_str(
			"SECURITY_JWT_SECRET",
			_env_str("JWT_SECRET", ""),
		),
		qdrant_host=_env_str("QDRANT_HOST", "http://localhost:6333"),
		qdrant_collection_tasks=_env_str("QDRANT_COLLECTION_TASKS", "tasks"),
		qdrant_collection_projects=_env_str("QDRANT_COLLECTION_PROJECTS", "projects"),
		sync_interval_minutes=_env_int("SYNC_INTERVAL_MINUTES", 60),
		sync_batch_size=_env_int("SYNC_BATCH_SIZE", 50),
		enable_sync=_env_bool("ENABLE_SYNC", True),
		chatbot_max_context_docs=_env_int("CHATBOT_MAX_CONTEXT_DOCS", 3),
		chatbot_max_context_docs_for_list=_env_int("CHATBOT_MAX_CONTEXT_DOCS_FOR_LIST", 10),
		chatbot_retrieval_top_k=_env_int("CHATBOT_RETRIEVAL_TOP_K", 20),
		chatbot_context_char_budget=_env_int("CHATBOT_CONTEXT_CHAR_BUDGET", 4_500),
		chatbot_history_char_budget=_env_int("CHATBOT_HISTORY_CHAR_BUDGET", 1_200),
		enable_system_prompt=_env_bool("ENABLE_SYSTEM_PROMPT", True),
		redis_url=_env_str("REDIS_URL", ""),
		cache_enabled=_env_bool("AI_CACHE_ENABLED", True),
		cache_read_enabled=_env_bool("AI_CACHE_READ_ENABLED", True),
		cache_write_enabled=_env_bool("AI_CACHE_WRITE_ENABLED", True),
		cache_ttl_seconds=_env_int("AI_CACHE_TTL_SECONDS", 900),
		cache_memory_ttl_seconds=_env_int("AI_CACHE_MEMORY_TTL_SECONDS", 120),
		cache_memory_max_items=_env_int("AI_CACHE_MEMORY_MAX_ITEMS", 512),
		cache_redis_prefix=_env_str("AI_CACHE_REDIS_PREFIX", "tasksense:ai"),
		cache_prompt_version=_env_str("AI_CACHE_PROMPT_VERSION", "chat_rag_v2026_05_16"),
		postgres_dsn=_env_str("POSTGRES_DSN", ""),
		postgres_host=_env_str("POSTGRES_HOST", "localhost"),
		postgres_port=_env_int("POSTGRES_PORT", 5432),
		postgres_db=_env_str("POSTGRES_DB", "taskdb"),
		postgres_user=_env_str("POSTGRES_USER", "postgres"),
		postgres_password=_env_str("POSTGRES_PASSWORD", "postgres"),
		postgres_sslmode=_env_str("POSTGRES_SSLMODE", "prefer"),
		mcp_endpoint=_env_str("SPRING_MCP_ENDPOINT", "http://localhost:8080/api/v1/mcp"),
		mcp_timeout_seconds=float(_env_str("SPRING_MCP_TIMEOUT_SECONDS", "20")),
		mcp_api_key=_env_secret_str("SPRING_MCP_API_KEY", ""),
	)
