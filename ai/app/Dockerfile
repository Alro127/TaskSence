# Base stage
FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	UV_NO_CACHE=1 \
	UV_COMPILE_BYTECODE=1 \
	UV_LINK_MODE=copy \
	PATH="/workspace/.venv/bin:$PATH"

WORKDIR /workspace

RUN pip install --no-cache-dir uv

# Dependency stage. Build context should be the ai/ folder.
FROM base AS dependencies

COPY pyproject.toml ./
COPY uv.lock ./

RUN uv sync --frozen --no-dev --no-install-project

# Runtime stage
FROM base AS runtime

COPY --from=dependencies /workspace/.venv ./.venv
COPY pyproject.toml ./
COPY uv.lock ./
COPY app ./app

RUN uv sync --frozen --no-dev

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
