# Docker Quick Reference for TaskSense

## Common Commands

### Start/Stop

```bash
# Start all services in background
docker-compose up -d

# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v
```

### Build

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build spring

# Build without cache
docker-compose build --no-cache spring

# Build and start
docker-compose up -d --build
```

### Logs

```bash
# View all logs (follow mode)
docker-compose logs -f

# View specific service logs
docker-compose logs -f spring
docker-compose logs -f ai
docker-compose logs -f nginx

# View last 100 lines
docker-compose logs --tail 100 spring

# View with timestamps
docker-compose logs -f --timestamps
```

### Status

```bash
# List all services and their status
docker-compose ps

# Show resource usage
docker stats

# Inspect specific container
docker inspect tasksense_spring
```

### Database Operations

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d taskdb

# Run a SQL query
docker-compose exec postgres psql -U postgres -d taskdb -c "SELECT * FROM users LIMIT 5;"

# Backup database
docker-compose exec postgres pg_dump -U postgres taskdb > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres taskdb < backup.sql

# Access pgAdmin
# Open: http://localhost:5050
# Email: admin@admin.com
# Password: admin
```

### Service Management

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart spring

# Stop specific service
docker-compose stop spring

# Start specific service
docker-compose start spring

# Remove all containers
docker-compose rm -f
```

### Execute Commands

```bash
# Run command in running container
docker-compose exec spring ls /app

# Run command without attaching
docker-compose exec -T spring cat /app/logs/app.log

# Run interactive shell
docker-compose exec -it spring /bin/bash
docker-compose exec -it postgres psql -U postgres
```

### Development

```bash
# Rebuild Spring after code changes
docker-compose build spring && docker-compose up -d spring

# Rebuild AI after code changes
docker-compose build ai && docker-compose up -d ai

# Rebuild frontend after code changes
docker-compose build frontend && docker-compose up -d frontend

# Follow Spring logs after restart
docker-compose logs -f spring
```

### Health Checks

```bash
# Test Spring health
curl http://localhost/api/v1/health/status

# Test AI service health
curl http://localhost/ai/health

# Test Nginx health
curl http://localhost/health

# Test frontend
curl http://localhost -I

# Test database
docker-compose exec postgres pg_isready -U postgres

# Test Redis
docker-compose exec redis redis-cli ping

# Test Elasticsearch
curl http://localhost:9200/_cluster/health

# Test Qdrant
curl http://localhost:6333/health
```

### Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove all unused data
docker system prune

# Aggressive cleanup (removes everything not currently in use)
docker system prune -a
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
vim .env

# View environment variables in a container
docker-compose exec spring env | grep SPRING_

# Pass environment variable at runtime
docker-compose run spring env
```

### Monitoring and Debugging

```bash
# Real-time resource monitoring
docker stats

# View container details
docker-compose ps --all

# Inspect network
docker network inspect tasksense_tasksense_net

# View all volumes
docker volume ls

# Inspect volume
docker volume inspect tasksense_postgres_data

# View Docker logs
docker-compose logs -f --tail 20 spring

# Check container IP address
docker-compose exec spring hostname -I
```

### Performance

```bash
# Limit container memory
# Edit docker-compose.yaml and add to service:
#   deploy:
#     resources:
#       limits:
#         memory: 1024M

# View memory usage
docker stats --no-stream

# Prune old images
docker image prune -a --filter "until=24h"
```

### Networking

```bash
# Check if services can reach each other
docker-compose exec spring ping redis

# Debug DNS resolution
docker-compose exec spring nslookup postgres

# Test port connectivity
docker-compose exec spring nc -zv elasticsearch 9200
```

## Environment File (.env)

### Required Variables

```bash
# OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Email
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# AI Service
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=xxx

# Frontend URLs
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_AI_API_BASE_URL=http://localhost:8080/ai
```

### Optional Variables

```bash
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your-access-key
AWS_SECRET_KEY=your-secret-key
AWS_BUCKET=your-bucket

# LLM Provider
LLM_PROVIDER=openai  # or anthropic

# Qdrant
QDRANT_API_KEY=your-api-key
```

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Nginx (Proxy) | 80 | http://localhost |
| Spring Backend | 8080 | http://localhost:8080/api/v1 |
| AI Service | 8000 | http://localhost:8000 |
| Frontend | 5173 | http://localhost:5173 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Elasticsearch | 9200 | http://localhost:9200 |
| Qdrant | 6333 | http://localhost:6333 |
| pgAdmin | 5050 | http://localhost:5050 |

## Troubleshooting Quick Fixes

```bash
# Service stuck? Full restart
docker-compose down -v && docker-compose build && docker-compose up -d

# Out of memory?
docker system prune -a && docker volume prune

# Port already in use?
# Find what's using port 8080
lsof -i :8080
# Kill process or change port in docker-compose.yaml

# Database locked?
docker-compose exec postgres psql -U postgres -d taskdb \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'taskdb' AND pid <> pg_backend_pid();"

# Want clean slate?
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

## File Locations (In Containers)

| Service | Location | Purpose |
|---------|----------|---------|
| Spring | `/app/app.jar` | Spring Boot JAR |
| AI | `/workspace/` | Python application |
| Frontend | `/app/dist/` | Built React app |
| Nginx | `/etc/nginx/nginx.conf` | Nginx configuration |
| PostgreSQL | `/var/lib/postgresql/data` | Database files |
| Redis | `/data` | Redis data |
| Elasticsearch | `/usr/share/elasticsearch/data` | ES indices |
| Qdrant | `/qdrant/storage` | Vector DB |

## Documentation Links

- Docker Compose: https://docs.docker.com/compose/compose-file/
- Nginx Configuration: https://nginx.org/en/docs/
- Spring Boot Docker: https://spring.io/guides/topicals/spring-boot-docker/
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/
- React + Vite: https://vitejs.dev/guide/
