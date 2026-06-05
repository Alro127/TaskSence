# TaskSense Docker Commands

This quick reference uses the current infrastructure compose file:

```bash
COMPOSE="docker compose -f infra/docker/compose.yaml"
```

For one-off commands, expand it directly as shown below. Do not use old service
names such as `spring`, `ai`, `frontend`, `postgres`, or `nginx`; the current
service names are `tasksense-spring-api`, `tasksense-ai`, `tasksense-client`,
`tasksense-postgres`, `tasksense-redis`, `tasksense-elasticsearch`,
`tasksense-qdrant`, and `tasksense-nginx`.

## Start / Stop

```bash
# Start all services in background
docker compose -f infra/docker/compose.yaml up -d

# Stop all services without removing containers
docker compose -f infra/docker/compose.yaml stop

# Stop and remove containers
docker compose -f infra/docker/compose.yaml down

# Stop and remove containers plus persistent volumes
docker compose -f infra/docker/compose.yaml down -v
```

## Build

```bash
# Build all local images
docker compose -f infra/docker/compose.yaml build

# Build one service
docker compose -f infra/docker/compose.yaml build tasksense-spring-api
docker compose -f infra/docker/compose.yaml build tasksense-ai
docker compose -f infra/docker/compose.yaml build tasksense-client

# Build without cache
docker compose -f infra/docker/compose.yaml build --no-cache tasksense-spring-api

# Build and start
docker compose -f infra/docker/compose.yaml up -d --build
```

When building tagged images for a registry, use the build override:

```bash
IMAGE_PREFIX=ghcr.io/acme/tasksense IMAGE_TAG=2026-06-05 \
  docker compose \
    -f infra/docker/compose.yaml \
    -f infra/docker/compose.build.yaml \
    build
```

## Logs

```bash
# All logs
docker compose -f infra/docker/compose.yaml logs -f

# Specific services
docker compose -f infra/docker/compose.yaml logs -f tasksense-spring-api
docker compose -f infra/docker/compose.yaml logs -f tasksense-ai
docker compose -f infra/docker/compose.yaml logs -f tasksense-nginx

# Last 100 lines
docker compose -f infra/docker/compose.yaml logs --tail 100 tasksense-spring-api

# Logs with timestamps
docker compose -f infra/docker/compose.yaml logs -f --timestamps
```

## Status

```bash
# List services and health state
docker compose -f infra/docker/compose.yaml ps

# Include stopped containers
docker compose -f infra/docker/compose.yaml ps --all

# Show resource usage
docker stats

# Inspect one container
docker inspect tasksense_spring_api
```

## Public Endpoints Through Nginx

`proxy/nginx.conf` is the source of truth. Current public routes:

```text
http://localhost/                 -> tasksense-client:5173
http://localhost/api/core/v1      -> tasksense-spring-api:8080/api/v1
http://localhost/api/core/v1/*    -> tasksense-spring-api:8080/api/v1/*
http://localhost/api/chat/v1      -> tasksense-ai:8000/api/v1
http://localhost/api/chat/v1/*    -> tasksense-ai:8000/api/v1/*
```

Not currently configured in Nginx:

```text
/api/v1/*
/chat/*
/ai/*
/health
HTTPS listener on 443
```

## Health Checks

```bash
# Frontend through Nginx
curl -I http://localhost

# Spring health through Nginx
curl http://localhost/api/core/v1/health

# AI API prefix through Nginx. This verifies proxy routing; the exact response
# depends on AI API implementation.
curl -i http://localhost/api/chat/v1

# AI internal health. Nginx does not expose /health.
docker compose -f infra/docker/compose.yaml exec tasksense-ai \
  python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())"

# Nginx configuration test
docker compose -f infra/docker/compose.yaml exec tasksense-nginx nginx -t

# PostgreSQL
docker compose -f infra/docker/compose.yaml exec tasksense-postgres pg_isready -U postgres

# Redis
docker compose -f infra/docker/compose.yaml exec tasksense-redis redis-cli ping

# Elasticsearch, internal network only
docker compose -f infra/docker/compose.yaml exec tasksense-elasticsearch \
  curl -fsS http://localhost:9200/_cluster/health

# Qdrant, internal network only
docker compose -f infra/docker/compose.yaml exec tasksense-qdrant \
  curl -fsS http://localhost:6333/health
```

## Database Operations

```bash
# Connect to PostgreSQL
docker compose -f infra/docker/compose.yaml exec tasksense-postgres \
  psql -U postgres -d taskdb

# Run a SQL query
docker compose -f infra/docker/compose.yaml exec tasksense-postgres \
  psql -U postgres -d taskdb -c "SELECT 1;"

# Backup database
docker compose -f infra/docker/compose.yaml exec tasksense-postgres \
  pg_dump -U postgres taskdb > backup.sql

# Restore database
docker compose -f infra/docker/compose.yaml exec -T tasksense-postgres \
  psql -U postgres taskdb < backup.sql
```

## Service Management

```bash
# Restart all services
docker compose -f infra/docker/compose.yaml restart

# Restart one service
docker compose -f infra/docker/compose.yaml restart tasksense-spring-api

# Stop/start one service
docker compose -f infra/docker/compose.yaml stop tasksense-spring-api
docker compose -f infra/docker/compose.yaml start tasksense-spring-api

# Remove stopped service containers
docker compose -f infra/docker/compose.yaml rm -f
```

## Execute Commands

```bash
# Shell in app containers
docker compose -f infra/docker/compose.yaml exec -it tasksense-spring-api /bin/bash
docker compose -f infra/docker/compose.yaml exec -it tasksense-ai /bin/bash

# Shell in Nginx container
docker compose -f infra/docker/compose.yaml exec -it tasksense-nginx /bin/sh

# View Spring environment variables
docker compose -f infra/docker/compose.yaml exec tasksense-spring-api env | grep SPRING_

# Show container IP
docker compose -f infra/docker/compose.yaml exec tasksense-spring-api hostname -I
```

## Networking Debug

```bash
# DNS lookup by Docker service name
docker compose -f infra/docker/compose.yaml exec tasksense-spring-api \
  getent hosts tasksense-postgres

# Test connectivity to Redis and Elasticsearch
docker compose -f infra/docker/compose.yaml exec tasksense-spring-api \
  sh -c "nc -zv tasksense-redis 6379 && nc -zv tasksense-elasticsearch 9200"

# Inspect Docker networks
docker network inspect tasksense_net
docker network inspect tasksense_database_net
```

## Environment File

Create `.env` from the template:

```bash
cp .env.example .env
```

Minimum required values for a deployable environment:

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
```

Important compose limitation: `infra/docker/compose.yaml` still hardcodes
PostgreSQL credentials for Flyway, seed, and Spring datasource. Keep
`POSTGRES_PASSWORD=postgres` unless you also introduce a compose override or
infra change.

## Exposed Ports

| Service | Host access | Notes |
| --- | --- | --- |
| Nginx | `http://localhost:80` | Only public host port in `infra/docker/compose.yaml` |
| Frontend | `http://localhost/` | Proxied to `tasksense-client:5173` |
| Spring API | `http://localhost/api/core/v1` | Proxied to internal `/api/v1` |
| AI API | `http://localhost/api/chat/v1` | Proxied to internal `/api/v1` |
| PostgreSQL | Internal only | `tasksense-postgres:5432` |
| Redis | Internal only | `tasksense-redis:6379` |
| Elasticsearch | Internal only | `tasksense-elasticsearch:9200` |
| Qdrant | Internal only | `tasksense-qdrant:6333` |

## Cleanup

```bash
# Remove stopped compose containers
docker compose -f infra/docker/compose.yaml rm

# Remove unused Docker objects
docker image prune
docker volume prune
docker system prune

# Aggressive cleanup
docker system prune -a
```

## Troubleshooting

```bash
# Full restart
docker compose -f infra/docker/compose.yaml down
docker compose -f infra/docker/compose.yaml up -d --build

# Clean database and caches
docker compose -f infra/docker/compose.yaml down -v
docker compose -f infra/docker/compose.yaml up -d --build

# Check Nginx route config
docker compose -f infra/docker/compose.yaml exec tasksense-nginx nginx -T

# Port 80 already in use
lsof -i :80
```
