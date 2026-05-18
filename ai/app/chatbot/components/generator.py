"""
Generator — produces a grounded answer by combining LLM reasoning with context documents.

The system prompt (answer.txt) enforces the RAG contract:
  - answer ONLY from provided context
    - when context is insufficient, return a warm 3-6 sentence
        fallback that suggests next-step questions

Context is formatted into labelled blocks (one per document) and injected into
the prompt via the {context} placeholder. A character budget (~1500 tokens) is
enforced before the prompt is sent to the LLM.
"""

import logging
from functools import lru_cache
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage

from app.chatbot.components import Document
from app.chatbot.components.context_optimizer import build_context, trim_history
from app.client.llms import get_llm
from app.config.config import get_settings

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "answer.txt"

FALLBACK = (
    "Tôi chưa thể trả lời chính xác ngay lúc này vì dữ liệu hiện có chưa đủ để xác nhận thông tin bạn cần. "
    "Có thể bạn đang hỏi về một task, project, sprint, hoặc workspace cụ thể nhưng ngữ cảnh hiện tại chưa chứa dữ liệu tương ứng. "
    "Bạn có thể cho mình thêm chi tiết như tên workspace, tên project, task title, hoặc khoảng thời gian để mình kiểm tra chính xác hơn. "
    "Gợi ý câu hỏi bạn có thể hỏi tiếp: \"Trong project X hiện có task nào đang quá hạn?\" hoặc \"Task nào đang IN_PROGRESS trong workspace Y tuần này?\""
)


@lru_cache(maxsize=1)
def _load_prompt_template() -> str:
    return _PROMPT_PATH.read_text(encoding="utf-8")


# ── Public API ────────────────────────────────────────────────────────────────

def generate(query: str, docs: list[Document], conversation_history: str = "") -> str:
    """
    Generate a grounded answer for the user query using the provided context.

    System prompt can be disabled via ENABLE_SYSTEM_PROMPT env var (default: true).

    Args:
        query: Original user question.
        docs:  Filtered context documents (output of filter_docs).
        conversation_history: Previous messages in the session for context.

    Returns:
        LLM-generated answer string, or FALLBACK when docs is empty.
    """
    if not docs:
        logger.warning("[generator] no context docs — returning fallback")
        return FALLBACK

    context = build_context(docs)
    compact_history = trim_history(conversation_history)
    logger.info("[generator] context_chars=%d doc_count=%d\n%s", len(context), len(docs), context)

    settings = get_settings()
    llm = get_llm()

    # Build messages based on system prompt setting
    if settings.enable_system_prompt:
        system_prompt = _load_prompt_template().replace("{context}", context).replace("{conversation_history}", compact_history)
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=query),
        ]
        logger.info("[generator] using system prompt (ENABLE_SYSTEM_PROMPT=True)")
    else:
        # When system prompt is disabled, use a minimal instruction
        context_section = f"CONTEXT:\n{context}\n\nCONVERSATION HISTORY:\n{compact_history}"
        user_message = f"{context_section}\n\nUSER QUESTION: {query}"
        messages = [HumanMessage(content=user_message)]
        logger.warning("[generator] system prompt disabled (ENABLE_SYSTEM_PROMPT=False) — using minimal context injection")

    response = llm.invoke(messages)
    answer = response.content.strip()  # type: ignore
    logger.info("[generator] answer=%r", answer)
    return answer
