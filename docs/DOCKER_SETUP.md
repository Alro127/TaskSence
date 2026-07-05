# Docker & Nginx Configuration Guide

## Overview

This guide documents the Docker and nginx setup for TaskSense, a monorepo containing:
- **Spring Boot Backend** (Java 21, Port 8080)
- **AI Service** (Python FastAPI, Port 8000)
- **React Frontend** (Vite, Port 5173)
- **Nginx Proxy** (Port 80/443)
- **Supporting Services**: PostgreSQL, Redis, Elasticsearch, Qdrant

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Nginx Proxy (80/443)                  │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │              │              │                          │ │
│  ▼              ▼              ▼                          ▼ │
│ /api/v1  ─────► Spring       /ai/  ──────► AI Service   /  ──► Frontend
│               Backend           (8000)      (5173)
│               (8080)
└─────────────────────────────────────────────────────────────┘
         ▼              ▼              ▼              ▼
      Redis       PostgreSQL    Elasticsearch      Qdrant
      (6379)      (5432)        (9200)            (6333)
```

## File Structure

```
TaskSense/
├── docker-compose.yaml          # Main orchestration file
├── .env.example                 # Environment variables template
│
├── server/
│   ├── Dockerfile              # Spring Boot multi-stage build
│   ├── pom.xml
│   └── src/
│
├── ai/
│   └── app/
│       ├── Dockerfile          # AI Service (Python)
│       └── main.py
│
├── client/
│   ├── Dockerfile              # Frontend (React/Vite)
│   ├── package.json
│   └── src/
│
└── proxy/
    ├── Dockerfile              # Nginx container
    └── nginx.conf              # Nginx routing configuration
```

## Quick Start

### 1. Setup Environment Variables

```bash
# Copy the example to .env
cp .env.example .env

# Edit .env with your actual values
vim .env
```

Required variables:
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - for OAuth
- `EMAIL_USERNAME` & `EMAIL_PASSWORD` - for email notifications
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - for AI service
- Optional: AWS, Elasticsearch credentials

### 2. Build and Start All Services

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f spring
docker-compose logs -f ai
docker-compose logs -f nginx
```

### 3. Verify Services

```bash
# Check all services are running
docker-compose ps

# Test endpoints
curl http://localhost/health                    # Nginx health
curl http://localhost/api/v1/health/status      # Spring health
curl http://localhost/ai/health                 # AI service health
curl http://localhost                           # Frontend
```

### 4. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (careful!)
docker-compose down -v
```

## Service Details

### Spring Boot Backend

**Dockerfile**: `server/Dockerfile`

- **Java Version**: 21 (Eclipse Temurin)
- **Build**: Multi-stage Maven build
- **Port**: 8080
- **Context Path**: `/api/v1`
- **Health Endpoint**: `/api/v1/health/status`

**Environment Variables**:
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/taskdb
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
SPRING_DATA_REDIS_HOST=redis
SPRING_DATA_REDIS_PORT=6379
SPRING_ELASTICSEARCH_URIS=http://elasticsearch:9200
```

### AI Service

**Dockerfile**: `ai/app/Dockerfile`

- **Python Version**: 3.13
- **Framework**: FastAPI with Uvicorn
- **Port**: 8000
- **Health Endpoint**: `/health`
- **Main Routes**: `/chat/`, `/embeddings/`, `/models/`

**Environment Variables**:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
QDRANT_HOST=qdrant
QDRANT_PORT=6333
BACKEND_URL=http://spring:8080/api/v1
REDIS_URL=redis://redis:6379
```

### Frontend

**Dockerfile**: `client/Dockerfile`

- **Node Version**: 20
- **Framework**: React 19 + Vite
- **Port**: 5173 (dev) / production build served via `serve`
- **Health Endpoint**: `/`

**Environment Variables**:
```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_AI_API_BASE_URL=http://localhost:8080/ai
```

### Nginx Proxy

**Dockerfile**: `proxy/Dockerfile`
**Config**: `proxy/nginx.conf`

- **Port**: 80 (HTTP), 443 (HTTPS ready)
- **Image**: nginx:alpine

**Routing**:
```
/api/v1/*  ──► Spring Backend (8080)
/chat/     ──► AI Service (8000)
/ai/*      ──► AI Service (8000)
/          ──► Frontend (5173)
/health    ──► Health check endpoint
```

**Features**:
- Automatic WebSocket upgrade for Vite HMR
- CORS headers for cross-origin requests
- Gzip compression
- Rate limiting ready
- HTTPS/SSL configuration commented (uncomment for production)

### Supporting Services

#### PostgreSQL (Port 5432)
```yaml
User: postgres
Password: postgres
Database: taskdb
```

#### Redis (Port 6379)
- Cache, sessions, task queues
- Data volume: `redis_data:/data`
- Append-only file (AOF) enabled

#### Elasticsearch (Port 9200)
- Full-text search for tasks
- Security disabled (enable for production)
- Data volume: `elasticsearch_data:/usr/share/elasticsearch/data`

#### Qdrant (Port 6333)
- Vector database for embeddings
- API Key: optional (set `QDRANT_API_KEY`)
- Data volume: `qdrant_data:/qdrant/storage`

#### Flyway & Seed
- Automatic database migrations on startup
- Seed data loading (if `seed_data.sql` exists)

#### pgAdmin (Port 5050)
- PostgreSQL admin UI
- Email: admin@admin.com
- Password: admin

## Advanced Usage

### Local Development (Without Docker)

For local development without Docker:

```bash
# Terminal 1: Start infrastructure
cd server
./docker-compose up postgres redis elasticsearch

# Terminal 2: Spring Boot
cd server
./mvnw spring-boot:run

# Terminal 3: AI Service
cd ai
uv run uvicorn app.main:app --reload

# Terminal 4: Frontend
cd client
npm run dev
```

### Database Access

**Via pgAdmin**:
- URL: http://localhost:5050
- Email: admin@admin.com
- Password: admin

**Via psql CLI**:
```bash
psql -h localhost -U postgres -d taskdb
```

### Logs and Monitoring

```bash
# All services
docker-compose logs -f

# Specific service with timestamps
docker-compose logs -f --timestamps spring

# Last 100 lines
docker-compose logs --tail 100 spring

# Real-time metrics
docker stats
```

### Rebuild Specific Service

```bash
# Rebuild Spring without cache
docker-compose build --no-cache spring

# Rebuild and restart
docker-compose up -d --build spring
```

### Database Migrations

Migrations run automatically on startup via Flyway. To add new migrations:

1. Create migration file in `server/src/main/resources/db/migration/`
   - Naming: `V###__description.sql` (e.g., `V004__add_new_table.sql`)
2. Restart Spring service: `docker-compose restart spring`

### Seed Data

Add seed data in `server/src/main/resources/db/seed/seed_data.sql`. Runs once after migrations.

## Production Deployment

### SSL/HTTPS Setup

1. Obtain certificates (Let's Encrypt recommended):
```bash
mkdir -p certs
# Copy cert.pem and key.pem to certs/
```

2. Uncomment HTTPS configuration in `proxy/nginx.conf`

3. Update docker-compose.yaml volumes:
```yaml
volumes:
  - ./certs/cert.pem:/etc/nginx/ssl/cert.pem:ro
  - ./certs/key.pem:/etc/nginx/ssl/key.pem:ro
```

### Environment Configuration

Create `.env` with production values:
```bash
# Security
GOOGLE_CLIENT_ID=prod-client-id
GOOGLE_CLIENT_SECRET=prod-secret

# Email
EMAIL_USERNAME=noreply@tasksense.app
EMAIL_PASSWORD=app-specific-password

# LLM
OPENAI_API_KEY=sk-prod-key
LLM_PROVIDER=openai

# URLs
VITE_API_BASE_URL=https://api.tasksense.app/api/v1
VITE_AI_API_BASE_URL=https://api.tasksense.app/ai
```

### Scale Up

Modify `docker-compose.yaml` for load balancing:
```yaml
services:
  spring:
    deploy:
      replicas: 3
    environment:
      JAVA_OPTS: -Xms1024m -Xmx2048m
  ai:
    deploy:
      replicas: 2
```

### Backup Strategy

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres taskdb > backup.sql

# Restore PostgreSQL
docker-compose exec -T postgres psql -U postgres taskdb < backup.sql

# Backup volumes
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs spring

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# Check if service is healthy
docker-compose ps

# Manually run migrations
docker-compose up flyway
```

### Nginx 502 Bad Gateway

```bash
# Check upstream services are running
docker-compose ps spring ai frontend

# Check nginx logs
docker-compose logs nginx

# Verify nginx configuration
docker-compose exec nginx nginx -t
```

### Out of Memory

Adjust in docker-compose.yaml:
```yaml
spring:
  environment:
    JAVA_OPTS: -Xms512m -Xmx2048m  # Increase as needed
```

### Slow Response Times

1. Check service logs for errors
2. Monitor docker stats: `docker stats`
3. Verify database performance: check pgAdmin query logs
4. Check Elasticsearch cluster health: `curl http://localhost:9200/_cluster/health`

## Monitoring and Health Checks

All services include health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://..."]
  interval: 30s
  timeout: 10s
  retries: 3
```

View health status:
```bash
docker-compose ps  # STATUS column shows health
```

## File Permissions

If you encounter permission issues:

```bash
# Fix Spring logs volume
docker-compose exec spring chmod 777 /app/logs

# Fix database volume
sudo chown -R 999:999 postgres_data/
```

## References

- **Spring Boot**: https://spring.io/projects/spring-boot
- **FastAPI**: https://fastapi.tiangolo.com/
- **Nginx**: https://nginx.org/
- **Docker Compose**: https://docs.docker.com/compose/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Redis**: https://redis.io/documentation
- **Elasticsearch**: https://www.elastic.co/guide/
- **Qdrant**: https://qdrant.tech/documentation/

## Support

For issues:
1. Check logs: `docker-compose logs -f <service>`
2. Verify environment variables in `.env`
3. Ensure all ports are available: `netstat -an | grep LISTEN`
4. Check disk space: `df -h`
5. Review service health: `docker-compose ps`