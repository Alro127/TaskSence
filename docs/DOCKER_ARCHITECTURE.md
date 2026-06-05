# TaskSense Docker Architecture

This document describes the current Docker architecture using
`infra/docker/compose.yaml` and `proxy/nginx.conf`.

## Source Of Truth

| Area | File |
| --- | --- |
| Runtime orchestration | `infra/docker/compose.yaml` |
| Registry image override | `infra/docker/compose.build.yaml` |
| Nginx image | `proxy/Dockerfile` |
| Nginx routing | `proxy/nginx.conf` |
| Environment template | `.env.example` |

`proxy/nginx.conf` is copied into the Nginx image by `proxy/Dockerfile`. It is
not bind-mounted from compose. The current compose file mounts only the
`nginx_cert` volume at `/etc/nginx/ssl`.

## High-Level Architecture

```text
Browser / API client
        |
        | http://localhost:80
        v
+-------------------------------+
| tasksense-nginx               |
| container: tasksense_nginx    |
| listens: 80                   |
+-------------------------------+
    |                 |                    |
    | /               | /api/core/v1       | /api/chat/v1
    v                 v                    v
+-----------+   +-------------------+   +--------------+
| Frontend  |   | Spring API        |   | AI Service   |
| 5173      |   | 8080 /api/v1      |   | 8000 /api/v1 |
+-----------+   +-------------------+   +--------------+
                    |      |      |             |
                    v      v      v             v
              PostgreSQL Redis Elasticsearch  Qdrant
              5432       6379  9200           6333
```

## Nginx Public Routes

The current `proxy/nginx.conf` has one HTTP server:

```text
listen 80;
server_name localhost;
```

Configured public routes:

| Public path | Upstream | Internal target |
| --- | --- | --- |
| `/` | `client_backend` | `tasksense-client:5173` |
| `/api/core/v1` | `core_backend` | `tasksense-spring-api:8080/api/v1` |
| `/api/core/v1/*` | `core_backend` | `tasksense-spring-api:8080/api/v1/*` |
| `/api/chat/v1` | `ai_backend` | `tasksense-ai:8000/api/v1` |
| `/api/chat/v1/*` | `ai_backend` | `tasksense-ai:8000/api/v1/*` |

Not configured in the current Nginx file:

```text
/api/v1/*
/chat/*
/ai/*
/health
HTTPS listener on 443
```

The AI service has an internal `/health` endpoint, but Nginx does not expose it
as `/health`.

## Request Flow

```text
GET http://localhost/
  -> tasksense-nginx
  -> tasksense-client:5173

GET http://localhost/api/core/v1/health
  -> tasksense-nginx
  -> tasksense-spring-api:8080/api/v1/health

GET http://localhost/api/chat/v1/...
  -> tasksense-nginx
  -> tasksense-ai:8000/api/v1/...
```

Nginx also sets CORS headers and WebSocket upgrade headers on the Spring and AI
API route blocks.

## Networks

```text
tasksense_net
  - tasksense-spring-api
  - tasksense-ai
  - tasksense-client
  - tasksense-nginx
  - tasksense-qdrant

tasksense_database_net (internal)
  - tasksense-postgres
  - tasksense-redis
  - tasksense-elasticsearch
  - tasksense-flyway
  - tasksense-seed
  - tasksense-spring-api
  - tasksense-ai
  - tasksense-qdrant
```

`tasksense_database_net` is internal, so database services are not exposed
directly to the host by the current compose file. Access them through
`docker compose exec` when operating locally.

## Startup Dependencies

```text
tasksense-postgres
  -> tasksense-flyway
      -> tasksense-seed

tasksense-postgres
tasksense-redis
tasksense-elasticsearch
tasksense-flyway
  -> tasksense-spring-api

tasksense-spring-api
tasksense-redis
tasksense-elasticsearch
  -> tasksense-ai

tasksense-spring-api
tasksense-ai
tasksense-client
  -> tasksense-nginx
```

`tasksense-client` has no explicit dependency. Nginx depends on it by service
name and proxies `/` to `tasksense-client:5173`.

## Container Names And Services

| Compose service | Container name | Role |
| --- | --- | --- |
| `tasksense-postgres` | `tasksense_postgres` | PostgreSQL |
| `tasksense-redis` | `tasksense_redis` | Redis |
| `tasksense-elasticsearch` | `tasksense_es` | Elasticsearch |
| `tasksense-flyway` | `tasksense_flyway` | DB migrations |
| `tasksense-seed` | `tasksense_seed` | Seed data |
| `tasksense-spring-api` | `tasksense_spring_api` | Spring Boot API |
| `tasksense-qdrant` | `tasksense_qdrant` | Vector database |
| `tasksense-ai` | `tasksense_ai` | AI API |
| `tasksense-client` | `tasksense_client` | React/Vite frontend |
| `tasksense-nginx` | `tasksense_nginx` | Reverse proxy |

## Ports

| Service | Internal port | Host port | Notes |
| --- | --- | --- | --- |
| Nginx | 80 | 80 | Only public host port in current compose |
| Spring API | 8080 | none | Public through `/api/core/v1` |
| AI Service | 8000 | none | Public through `/api/chat/v1` |
| Frontend | 5173 | none | Public through `/` |
| PostgreSQL | 5432 | none | Internal only |
| Redis | 6379 | none | Internal only |
| Elasticsearch | 9200 | none | Internal only |
| Qdrant | 6333 | none | Internal only |

## Volumes

| Volume | Mounted at | Service |
| --- | --- | --- |
| `tasksense_nginx_cert` | `/etc/nginx/ssl` | `tasksense-nginx` |
| `tasksense_pg_data` | `/var/lib/postgresql/data` | `tasksense-postgres` |
| `tasksense_redis_data` | `/data` | `tasksense-redis` |
| `tasksense_es_data` | `/usr/share/elasticsearch/data` | `tasksense-elasticsearch` |
| `tasksense_qdrant_data` | `/qdrant/storage` | `tasksense-qdrant` |

Bind mounts:

| Host path | Container path | Used by |
| --- | --- | --- |
| `server/src/main/resources/db/migration` | `/flyway/sql` | `tasksense-flyway` |
| `server/src/main/resources/db/seed` | `/seed` | `tasksense-seed` |

## Health Checks

| Service | Check |
| --- | --- |
| `tasksense-postgres` | `pg_isready -U postgres` |
| `tasksense-redis` | `redis-cli ping` |
| `tasksense-elasticsearch` | `curl -fsS http://localhost:9200/_cluster/health` |
| `tasksense-spring-api` | `curl -f http://localhost:8080/api/v1/health` |
| `tasksense-qdrant` | `curl -f http://localhost:6333/health` |
| `tasksense-ai` | Python request to `http://localhost:8000/health` |

The current compose file does not define a health check for `tasksense-nginx`
or `tasksense-client`. To verify Nginx manually:

```bash
docker compose -f infra/docker/compose.yaml exec tasksense-nginx nginx -t
curl -I http://localhost
```

## Kubernetes Mapping

| Docker Compose concept | Kubernetes equivalent |
| --- | --- |
| Compose service | Deployment or Job |
| Container name | Pod container name |
| `depends_on: condition: service_healthy` | init containers, startup probes, readiness probes |
| Named volume | PersistentVolumeClaim |
| `tasksense_net` service DNS | Kubernetes Service DNS |
| `tasksense-nginx` reverse proxy | Ingress Controller or standalone Nginx Deployment |
| `.env` | ConfigMap plus Secret |
| Flyway one-shot service | Kubernetes Job |
| Seed one-shot service | Kubernetes Job |

For Kubernetes, expose the app through an Ingress with these path mappings:

```text
/                 -> frontend Service
/api/core/v1      -> spring-api Service, rewritten to /api/v1
/api/core/v1/*    -> spring-api Service, rewritten to /api/v1/*
/api/chat/v1      -> ai Service, rewritten to /api/v1
/api/chat/v1/*    -> ai Service, rewritten to /api/v1/*
```
