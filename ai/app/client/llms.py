"""
LLM factory and shared LLM output utilities.

Environment variables
---------------------
LLM_PROVIDER   : "openai" (default) | "gemini"
OPENAI_API_KEY : required when LLM_PROVIDER=openai
OPENAI_MODEL   : model name, default "gpt-4o-mini"
GEMINI_API_KEY : required when LLM_PROVIDER=gemini
GEMINI_MODEL   : model name, default "gemini-1.5-flash"
"""

import json
from functools import lru_cache
from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel

from app.config.config import get_settings

# ── LLM factory ───────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_llm() -> BaseChatModel:
    """
    Return a cached LangChain chat model configured from environment variables.

    The instance is created once per process and reused for all subsequent calls.
    temperature is fixed at 0 to ensure deterministic, factual responses.

    Raises:
        ValueError: if the required API key is missing or the provider is unknown.
    """
    settings = get_settings()
    provider = settings.llm_provider

    if provider == "openai":
        from langchain_openai import ChatOpenAI

        api_key = settings.openai_api_key
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not set")

        return ChatOpenAI(
            model=settings.openai_model,
            temperature=0,
            api_key=api_key,
        )

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        api_key = settings.gemini_api_key
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set")

        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            temperature=0,
            google_api_key=api_key,
        )
    
    if provider == "openrouter":
        from langchain_openrouter import ChatOpenRouter

        api_key = settings.openrouter_api_key
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is not set")

        return ChatOpenRouter(
            model=settings.openrouter_model,
            temperature=0.3,
            api_key=api_key,
        )    
    raise ValueError(
        f"Unsupported LLM_PROVIDER: '{provider}'. Accepted values: 'openai', 'gemini', 'openrouter'."
    )


# ── LLM output parsing ────────────────────────────────────────────────────────

def parse_llm_json(text: str) -> Any:
    """
    Parse JSON from LLM output, stripping markdown code fences when present.

    LLMs sometimes wrap JSON in ```json ... ``` blocks even when instructed not to.
    This function handles both raw JSON and fenced variants transparently.

    Args:
        text: Raw string content from an LLM response.

    Returns:
        Parsed Python object (dict, list, etc.).

    Raises:
        json.JSONDecodeError: if the text is not valid JSON after stripping fences.
    """
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # Drop opening fence line (e.g. "```json") and closing fence line ("```")
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        text = "\n".join(inner)
    return json.loads(text.strip())
