# TaskSense Docker Summary

This summary reflects the current repo state:

- Runtime compose file: `infra/docker/compose.yaml`
- Optional image tagging override: `infra/docker/compose.build.yaml`
- Nginx config: `proxy/nginx.conf`
- Environment template: `.env.example`

No root `docker-compose.yaml` or `docker-startup.sh` is used by the current
Docker docs.

## Services

| Service | Container | Purpose |
| --- | --- | --- |
| `tasksense-nginx` | `tasksense_nginx` | Public reverse proxy on host port 80 |
| `tasksense-client` | `tasksense_client` | React/Vite frontend on internal port 5173 |
| `tasksense-spring-api` | `tasksense_spring_api` | Spring Boot API on internal port 8080 |
| `tasksense-ai` | `tasksense_ai` | AI API on internal port 8000 |
| `tasksense-postgres` | `tasksense_postgres` | PostgreSQL database |
| `tasksense-redis` | `tasksense_redis` | Redis cache |
| `tasksense-elasticsearch` | `tasksense_es` | Search engine |
| `tasksense-qdrant` | `tasksense_qdrant` | Vector database |
| `tasksense-flyway` | `tasksense_flyway` | Database migrations |
| `tasksense-seed` | `tasksense_seed` | Seed data loader |

## Nginx Routing

`proxy/nginx.conf` is the source of truth. It is copied into the image by
`proxy/Dockerfile`.

```text
http://localhost/                 -> tasksense-client:5173
http://localhost/api/core/v1      -> tasksense-spring-api:8080/api/v1
http://localhost/api/core/v1/*    -> tasksense-spring-api:8080/api/v1/*
http://localhost/api/chat/v1      -> tasksense-ai:8000/api/v1
http://localhost/api/chat/v1/*    -> tasksense-ai:8000/api/v1/*
```

Not configured in the current Nginx file:

```text
/api/v1/*
/chat/*
/ai/*
/health
HTTPS listener on 443
```

The AI service has an internal `/health` endpoint, but the current Nginx config
does not route it publicly.

## Quick Start

```bash
cp .env.example .env
# Edit .env with real secrets and provider keys.

docker compose -f infra/docker/compose.yaml build
docker compose -f infra/docker/compose.yaml up -d
docker compose -f infra/docker/compose.yaml ps
```

View logs:

```bash
docker compose -f infra/docker/compose.yaml logs -f
docker compose -f infra/docker/compose.yaml logs -f tasksense-spring-api
docker compose -f infra/docker/compose.yaml logs -f tasksense-ai
docker compose -f infra/docker/compose.yaml logs -f tasksense-nginx
```

Stop services:

```bash
docker compose -f infra/docker/compose.yaml down
```

Clean reset:

```bash
docker compose -f infra/docker/compose.yaml down -v
docker compose -f infra/docker/compose.yaml up -d --build
```

## Access Points

| Area | URL |
| --- | --- |
| Frontend | `http://localhost/` |
| Spring API through Nginx | `http://localhost/api/core/v1` |
| AI API through Nginx | `http://localhost/api/chat/v1` |

The current compose file only publishes host port `80`. PostgreSQL, Redis,
Elasticsearch, Qdrant, Spring, AI, and frontend ports are internal container
ports.

## Verification

```bash
# Frontend / Nginx
curl -I http://localhost

# Spring health through Nginx
curl http://localhost/api/core/v1/health

# AI proxy route through Nginx
curl -i http://localhost/api/chat/v1

# AI internal health
docker compose -f infra/docker/compose.yaml exec tasksense-ai \
  python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())"

# Database
docker compose -f infra/docker/compose.yaml exec tasksense-postgres \
  psql -U postgres -d taskdb -c "SELECT 1;"

# Redis
docker compose -f infra/docker/compose.yaml exec tasksense-redis redis-cli ping
```

## Environment Notes

Copy `.env.example` to `.env`, then configure:

- `SECURITY_JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`
- LLM provider keys such as `OPENAI_API_KEY`, `OPENROUTER_API_KEY`,
  `GEMINI_API_KEY`, or `SILICONFLOW_API_KEY`
- Frontend build URLs:
  - `VITE_API_BASE_URL=http://localhost/api/core/v1`
  - `VITE_API_AGENT_BASE_URL=http://localhost/api/chat/v1`
  - `VITE_WS_URL=ws://localhost/api/core/v1/ws`

Important: `infra/docker/compose.yaml` still hardcodes PostgreSQL credentials in
Flyway, seed, and Spring datasource. Keep `POSTGRES_PASSWORD=postgres` unless a
compose override or infra change is added.

## Production Image Build

Use `infra/docker/compose.build.yaml` when images need registry tags:

```bash
IMAGE_PREFIX=ghcr.io/acme/tasksense IMAGE_TAG=2026-06-05 \
  docker compose \
    -f infra/docker/compose.yaml \
    -f infra/docker/compose.build.yaml \
    build
```

For production frontend URLs, pass Vite build args during `tasksense-client`
build or use a compose override. Vite reads these values at build time, not
container startup time.

## Related Docs

- `docs/DOCKER_SETUP.md`
- `docs/DOCKER_COMMANDS.md`
- `docs/DOCKER_ARCHITECTURE.md`
- `docs/TASKSENSE_DEPLOYMENT_KT.md`
