# TaskSense Docker Docs Index

Use these Docker docs with the current infrastructure files:

- `infra/docker/compose.yaml`
- `infra/docker/compose.build.yaml`
- `proxy/nginx.conf`
- `.env.example`

## Recommended Reading

1. `docs/DOCKER_SUMMARY.md`
   - Fast overview, service list, Nginx route summary, quick commands.

2. `docs/DOCKER_SETUP.md`
   - Full setup and deploy-oriented guide.

3. `docs/DOCKER_COMMANDS.md`
   - Copy-paste command reference for operations and debugging.

4. `docs/DOCKER_ARCHITECTURE.md`
   - Architecture, networking, volumes, health checks, Kubernetes mapping.

5. `docs/TASKSENSE_DEPLOYMENT_KT.md`
   - Broader deployment KT, environment preparation, and improvement plans.

## First Run

```bash
cp .env.example .env
# Edit .env with real secrets.

docker compose -f infra/docker/compose.yaml build
docker compose -f infra/docker/compose.yaml up -d
docker compose -f infra/docker/compose.yaml ps
```

## Public URLs

| Area | URL | Notes |
| --- | --- | --- |
| Frontend | `http://localhost/` | Nginx -> `tasksense-client:5173` |
| Spring API | `http://localhost/api/core/v1` | Nginx rewrites to Spring `/api/v1` |
| AI API | `http://localhost/api/chat/v1` | Nginx rewrites to AI `/api/v1` |

Nginx currently listens only on port `80`. The current config does not expose
`/health`, `/api/v1`, `/ai`, `/chat`, or HTTPS `443`.

## Common Tasks

```bash
# View all logs
docker compose -f infra/docker/compose.yaml logs -f

# View one service log
docker compose -f infra/docker/compose.yaml logs -f tasksense-spring-api

# Stop services
docker compose -f infra/docker/compose.yaml down

# Database shell
docker compose -f infra/docker/compose.yaml exec tasksense-postgres \
  psql -U postgres -d taskdb

# Rebuild Spring API
docker compose -f infra/docker/compose.yaml build tasksense-spring-api
docker compose -f infra/docker/compose.yaml up -d tasksense-spring-api
```

## Verification Checklist

```text
[ ] Docker is installed
    docker --version

[ ] Docker Compose plugin is installed
    docker compose version

[ ] .env exists
    test -f .env

[ ] Compose config renders
    docker compose --env-file .env -f infra/docker/compose.yaml config --quiet

[ ] Containers are up
    docker compose -f infra/docker/compose.yaml ps

[ ] Frontend/Nginx responds
    curl -I http://localhost

[ ] Spring API health responds through Nginx
    curl http://localhost/api/core/v1/health

[ ] AI proxy route is reachable through Nginx
    curl -i http://localhost/api/chat/v1

[ ] AI internal health responds
    docker compose -f infra/docker/compose.yaml exec tasksense-ai \
      python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())"

[ ] Database responds
    docker compose -f infra/docker/compose.yaml exec tasksense-postgres \
      psql -U postgres -d taskdb -c "SELECT 1;"
```

## Important Configuration

| File | Purpose |
| --- | --- |
| `.env.example` | Deployment environment template |
| `infra/docker/compose.yaml` | Runtime services, networks, volumes |
| `infra/docker/compose.build.yaml` | Optional image names for registry builds |
| `proxy/nginx.conf` | Public route map and proxy behavior |
| `proxy/Dockerfile` | Copies `nginx.conf` into the Nginx image |
| `server/Dockerfile` | Spring Boot image |
| `ai/app/Dockerfile` | AI service image |
| `client/Dockerfile` | Frontend image |

## Troubleshooting Entry Points

| Issue | First command |
| --- | --- |
| Nginx 502/504 | `docker compose -f infra/docker/compose.yaml logs -f tasksense-nginx` |
| Spring failed | `docker compose -f infra/docker/compose.yaml logs -f tasksense-spring-api` |
| AI failed | `docker compose -f infra/docker/compose.yaml logs -f tasksense-ai` |
| Database failed | `docker compose -f infra/docker/compose.yaml logs -f tasksense-postgres` |
| Route mismatch | `docker compose -f infra/docker/compose.yaml exec tasksense-nginx nginx -T` |
| Bad env interpolation | `docker compose --env-file .env -f infra/docker/compose.yaml config` |
