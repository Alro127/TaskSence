# TaskSense Docker Setup

This guide documents how to run TaskSense with the current Docker
infrastructure. It is aligned with `infra/docker/compose.yaml` and
`proxy/nginx.conf`.

## Architecture

```text
Host browser/client
  |
  | http://localhost:80
  v
tasksense-nginx
  |-- /                 -> tasksense-client:5173
  |-- /api/core/v1      -> tasksense-spring-api:8080/api/v1
  |-- /api/core/v1/*    -> tasksense-spring-api:8080/api/v1/*
  |-- /api/chat/v1      -> tasksense-ai:8000/api/v1
  |-- /api/chat/v1/*    -> tasksense-ai:8000/api/v1/*

tasksense-spring-api -> PostgreSQL, Redis, Elasticsearch
tasksense-ai         -> Spring API, Redis, Elasticsearch, Qdrant, PostgreSQL
```

Current Nginx does not define `/health`, `/api/v1`, `/ai`, `/chat`, or HTTPS
`443` as public routes.

## Files

| File | Purpose |
| --- | --- |
| `infra/docker/compose.yaml` | Runtime compose stack |
| `infra/docker/compose.build.yaml` | Optional image names for registry builds |
| `.env.example` | Deployment environment template |
| `proxy/nginx.conf` | Nginx route source of truth |
| `proxy/Dockerfile` | Builds Nginx image and copies `nginx.conf` |
| `server/Dockerfile` | Spring Boot image |
| `ai/app/Dockerfile` | AI service image |
| `client/Dockerfile` | Frontend image |

## Environment Preparation

Create the deploy environment file:

```bash
cp .env.example .env
```

Set at minimum:

```bash
SECURITY_JWT_SECRET=change-me-to-a-long-random-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost

EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-email-app-password

LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

VITE_API_BASE_URL=http://localhost/api/core/v1
VITE_API_AGENT_BASE_URL=http://localhost/api/chat/v1
VITE_WS_URL=ws://localhost/api/core/v1/ws
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Provider-specific keys supported by the template:

```bash
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
GEMINI_API_KEY=
SILICONFLOW_API_KEY=
```

Important current limitation: `infra/docker/compose.yaml` hardcodes PostgreSQL
credentials for Flyway, seed, and Spring datasource. Keep:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=taskdb
```

Change those only after adding a compose override or infra change that updates
all DB consumers consistently.

## Build And Start

```bash
docker compose --env-file .env -f infra/docker/compose.yaml config --quiet
docker compose --env-file .env -f infra/docker/compose.yaml build
docker compose --env-file .env -f infra/docker/compose.yaml up -d
docker compose --env-file .env -f infra/docker/compose.yaml ps
```

Follow logs:

```bash
docker compose --env-file .env -f infra/docker/compose.yaml logs -f
```

Stop:

```bash
docker compose --env-file .env -f infra/docker/compose.yaml down
```

Clean reset:

```bash
docker compose --env-file .env -f infra/docker/compose.yaml down -v
docker compose --env-file .env -f infra/docker/compose.yaml up -d --build
```

## Verify Runtime

```bash
# Frontend and Nginx
curl -I http://localhost

# Spring health through Nginx
curl http://localhost/api/core/v1/health

# AI API route through Nginx
curl -i http://localhost/api/chat/v1

# AI internal health. Nginx does not expose /health.
docker compose --env-file .env -f infra/docker/compose.yaml exec tasksense-ai \
  python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())"

# Nginx syntax
docker compose --env-file .env -f infra/docker/compose.yaml exec tasksense-nginx nginx -t

# Database
docker compose --env-file .env -f infra/docker/compose.yaml exec tasksense-postgres \
  psql -U postgres -d taskdb -c "SELECT 1;"

# Redis
docker compose --env-file .env -f infra/docker/compose.yaml exec tasksense-redis redis-cli ping
```

## Service Details

### Spring API

| Item | Value |
| --- | --- |
| Service | `tasksense-spring-api` |
| Container | `tasksense_spring_api` |
| Internal port | `8080` |
| Internal context path | `/api/v1` |
| Public Nginx path | `/api/core/v1` |
| Health | `/api/v1/health` internally, `/api/core/v1/health` publicly |

### AI Service

| Item | Value |
| --- | --- |
| Service | `tasksense-ai` |
| Container | `tasksense_ai` |
| Internal port | `8000` |
| Internal API prefix | `/api/v1` |
| Public Nginx path | `/api/chat/v1` |
| Health | `/health` internally only |

### Frontend

| Item | Value |
| --- | --- |
| Service | `tasksense-client` |
| Container | `tasksense_client` |
| Internal port | `5173` |
| Public Nginx path | `/` |

Vite variables are build-time values. If `VITE_API_BASE_URL`,
`VITE_API_AGENT_BASE_URL`, `VITE_WS_URL`, or `VITE_GOOGLE_CLIENT_ID` changes,
rebuild `tasksense-client`.

### Nginx

| Item | Value |
| --- | --- |
| Service | `tasksense-nginx` |
| Container | `tasksense_nginx` |
| Host port | `80` |
| Config source | `proxy/nginx.conf` copied into image |

The current compose file does not bind mount `proxy/nginx.conf`. After changing
Nginx config, rebuild the Nginx image:

```bash
docker compose --env-file .env -f infra/docker/compose.yaml build tasksense-nginx
docker compose --env-file .env -f infra/docker/compose.yaml up -d tasksense-nginx
```

## Networks And Ports

| Network | Role |
| --- | --- |
| `tasksense_net` | Public app network for Nginx, frontend, Spring, AI, Qdrant |
| `tasksense_database_net` | Internal network for databases and services that need them |

Only host port `80` is published by the current compose file.

| Internal service | Internal address |
| --- | --- |
| Spring | `tasksense-spring-api:8080` |
| AI | `tasksense-ai:8000` |
| Frontend | `tasksense-client:5173` |
| PostgreSQL | `tasksense-postgres:5432` |
| Redis | `tasksense-redis:6379` |
| Elasticsearch | `tasksense-elasticsearch:9200` |
| Qdrant | `tasksense-qdrant:6333` |

## Production Build With Registry Tags

`infra/docker/compose.build.yaml` adds image names for the three app images.

```bash
IMAGE_PREFIX=ghcr.io/acme/tasksense IMAGE_TAG=2026-06-05 \
  docker compose \
    --env-file .env \
    -f infra/docker/compose.yaml \
    -f infra/docker/compose.build.yaml \
    build
```

Push:

```bash
IMAGE_PREFIX=ghcr.io/acme/tasksense IMAGE_TAG=2026-06-05 \
  docker compose \
    --env-file .env \
    -f infra/docker/compose.yaml \
    -f infra/docker/compose.build.yaml \
    push tasksense-spring-api tasksense-ai tasksense-client
```

On a server, pull and start with the same image prefix/tag:

```bash
IMAGE_PREFIX=ghcr.io/acme/tasksense IMAGE_TAG=2026-06-05 \
  docker compose \
    --env-file .env \
    -f infra/docker/compose.yaml \
    -f infra/docker/compose.build.yaml \
    pull

IMAGE_PREFIX=ghcr.io/acme/tasksense IMAGE_TAG=2026-06-05 \
  docker compose \
    --env-file .env \
    -f infra/docker/compose.yaml \
    -f infra/docker/compose.build.yaml \
    up -d
```

## Kubernetes Mapping

| Compose | Kubernetes |
| --- | --- |
| `tasksense-spring-api` | Spring API Deployment + Service |
| `tasksense-ai` | AI Deployment + Service |
| `tasksense-client` | Frontend Deployment + Service |
| `tasksense-nginx` | Ingress Controller or Nginx Deployment |
| `tasksense-flyway` | Migration Job |
| `tasksense-seed` | Seed Job |
| Named volumes | PVCs |
| `.env` | ConfigMaps and Secrets |
| Health checks | readiness/liveness/startup probes |

Ingress path plan:

```text
/                 -> frontend Service
/api/core/v1      -> spring-api Service, rewrite to /api/v1
/api/core/v1/*    -> spring-api Service, rewrite to /api/v1/*
/api/chat/v1      -> ai Service, rewrite to /api/v1
/api/chat/v1/*    -> ai Service, rewrite to /api/v1/*
```

## Troubleshooting

### Nginx 502 or 504

```bash
docker compose --env-file .env -f infra/docker/compose.yaml ps
docker compose --env-file .env -f infra/docker/compose.yaml logs -f tasksense-nginx
docker compose --env-file .env -f infra/docker/compose.yaml exec tasksense-nginx nginx -T
```

Check that upstream service names in `proxy/nginx.conf` are still:

```text
tasksense-spring-api:8080
tasksense-ai:8000
tasksense-client:5173
```

### Spring Cannot Start

```bash
docker compose --env-file .env -f infra/docker/compose.yaml logs -f tasksense-spring-api
docker compose --env-file .env -f infra/docker/compose.yaml logs -f tasksense-postgres
docker compose --env-file .env -f infra/docker/compose.yaml logs -f tasksense-elasticsearch
```

### AI Cannot Start

```bash
docker compose --env-file .env -f infra/docker/compose.yaml logs -f tasksense-ai
docker compose --env-file .env -f infra/docker/compose.yaml exec tasksense-ai env | grep -E 'LLM|OPENAI|QDRANT|REDIS|ELASTICSEARCH|SECURITY'
```

### Frontend Calls Wrong API URL

Vite variables are baked during build. Rebuild the frontend image after changing
frontend URLs:

```bash
docker compose --env-file .env -f infra/docker/compose.yaml build tasksense-client
docker compose --env-file .env -f infra/docker/compose.yaml up -d tasksense-client tasksense-nginx
```
