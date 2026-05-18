# TaskSense Docker Architecture & Flow Diagrams

## 1. System Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     INTERNET / CLIENT BROWSER                  │
└────────────────────────────────────────────────────────────────┘
                                ▲
                                │ HTTP/HTTPS (Port 80/443)
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                   NGINX REVERSE PROXY                          │
│              docker: tasksense_nginx (Alpine)                  │
├────────────────────────────────────────────────────────────────┤
│  • Listens on: 0.0.0.0:80, 0.0.0.0:443                        │
│  • Volume: ./proxy/nginx.conf:/etc/nginx/nginx.conf:ro        │
│  • Network: tasksense_net                                     │
│  • Health: /health endpoint                                   │
└────────────────────────────────────────────────────────────────┘
                 │              │              │
         ┌───────┴──────┬───────┴──────┬───────┴──────┐
         │              │              │              │
         ▼              ▼              ▼              ▼
    /api/v1/*      /chat/*      /ai/*           /
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌────────┐   ┌────────┐   ┌────────┐     ┌──────────┐
    │ SPRING │   │   AI   │   │   AI   │     │ FRONTEND │
    │ BOOT   │   │SERVICE │   │SERVICE │     │  REACT   │
    │ (8080) │   │ (8000) │   │ (8000) │     │ (5173)   │
    └────────┘   └────────┘   └────────┘     └──────────┘
         │
         ├─► PostgreSQL (5432)
         ├─► Redis (6379)
         ├─► Elasticsearch (9200)
         └─► Qdrant (6333)
```

## 2. Container Startup Sequence

```
Start Request
     │
     ▼
┌─────────────────────────┐
│   tasksense_postgres    │ ◄─── Starts first
│   (PostgreSQL 16)       │      (no dependencies)
│   Status: Running       │
│   Health: Checking...   │
└─────────────────────────┘
     │ (healthy)
     ▼
┌─────────────────────────┐
│   task_redis            │
│   (Redis 7)             │ ◄─── Start after DB
│   Status: Running       │
└─────────────────────────┘
     │ (healthy)
     ▼
┌─────────────────────────┐
│   tasksense_es          │
│   (Elasticsearch 9)     │ ◄─── Start in parallel
│   Status: Running       │
└─────────────────────────┘
     │ (healthy)
     ▼
┌─────────────────────────┐
│   task_flyway           │
│   (DB Migrations)       │ ◄─── Migrations after DB ready
│   Status: Completed     │
└─────────────────────────┘
     │ (completed)
     ├───────────────────┐
     ▼                   ▼
┌──────────────┐   ┌──────────────┐
│ task_seed    │   │ tasksense_qt │
│ (Seed Data)  │   │ drant        │
│ Status: Done │   │ (Vector DB)  │
└──────────────┘   └──────────────┘
     │                   │
     └───────────┬───────┘
                 ▼
         ┌─────────────────────────┐
         │   tasksense_spring      │
         │   (Spring Boot)         │ ◄─── Wait for DB
         │   Port: 8080            │      Redis, ES
         │   Health: Checking...   │
         └─────────────────────────┘
                 │ (healthy)
                 ├────────────────────┐
                 ▼                    ▼
         ┌─────────────────┐  ┌─────────────────┐
         │ tasksense_ai    │  │ tasksense_nginx │
         │ (AI Service)    │  │ (Proxy)         │
         │ Port: 8000      │  │ Port: 80/443    │
         │ Status: Running │  │ Status: Ready   │
         └─────────────────┘  └─────────────────┘
                 │                    │
                 └─────────┬──────────┘
                           ▼
                    ┌─────────────────┐
                    │ tasksense_pgad- │
                    │ min (pgAdmin)   │
                    │ Port: 5050      │
                    │ Status: Running │
                    └─────────────────┘
```

## 3. Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              Browser Request to http://localhost/            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │  Nginx Listener:80   │
                 │  (tasksense_nginx)   │
                 └──────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ Location: /      │  │Location: /api/v1 │  │Location: /ai/    │
    │ Proxy: frontend  │  │ Proxy: spring    │  │Proxy: ai         │
    │       :5173      │  │      :8080       │  │      :8000       │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
            │                      │                      │
            ▼                      ▼                      ▼
    React App Loaded       API Response              AI Response
            │                      │                      │
            ▼                      ▼                      ▼
    Fetches /api/v1 ──► Spring Backend ────────► Returns Data
            │              (Controllers,
            │               Services,
            │               Repositories)
            │                      │
            └──────────────────────┼──────────────────┐
                                   │                  │
            ┌──────────────────────┼──────────────────┐
            │                      │                  │
            ▼                      ▼                  ▼
        PostgreSQL             Redis              Elasticsearch
        (Persisted)         (Cached Data)      (Search Index)
```

## 4. Network Topology

```
┌─────────────────────────────────────────────────────────┐
│           Docker Network: tasksense_net                 │
│           (bridge driver, IP range: 172.18.0.0/16)     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ postgres │  │  redis   │  │elastics.│  │qdrant  │ │
│  │:5432    │  │ :6379   │  │:9200    │  │:6333  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │              │             │           │      │
│  ┌────┴──────────────┴─────────────┴───────────┴──┐   │
│  │                                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ spring   │  │    ai    │  │ frontend │   │   │
│  │  │:8080    │  │ :8000   │  │ :5173   │   │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘   │   │
│  │       │              │             │         │   │
│  │  ┌────┴──────────────┴─────────────┴────┐   │   │
│  │  │      nginx (reverse proxy)           │   │   │
│  │  │          :80, :443                   │   │   │
│  │  └──────────────────────────────────────┘   │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│ All services can reach each other via:               │
│ • Service name (e.g., spring:8080)                   │
│ • Container name (e.g., tasksense_spring)            │
│                                                       │
└─────────────────────────────────────────────────────────┘

Host Ports Exposed:
┌────────────────────────────────────────────────┐
│ Port  │ Service          │ Protocol            │
├────────────────────────────────────────────────┤
│ 80    │ nginx            │ HTTP                │
│ 443   │ nginx            │ HTTPS (optional)    │
│ 5050  │ pgAdmin          │ HTTP (GUI)          │
│ 5173  │ frontend (dev)   │ HTTP + WebSocket    │
│ 5432  │ PostgreSQL       │ TCP                 │
│ 6333  │ Qdrant           │ HTTP                │
│ 6334  │ Qdrant (gRPC)    │ gRPC                │
│ 6379  │ Redis            │ TCP                 │
│ 8000  │ AI Service       │ HTTP                │
│ 8080  │ Spring Backend   │ HTTP                │
│ 9200  │ Elasticsearch    │ HTTP                │
└────────────────────────────────────────────────┘
```

## 5. Data Persistence & Volumes

```
┌─────────────────────────────────────────────────────────┐
│              Docker Volumes (Named)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  postgres_data                                          │
│  ├─ Mount: /var/lib/postgresql/data                   │
│  ├─ Service: PostgreSQL                                │
│  └─ Contents: Database tables, indices                 │
│                                                         │
│  redis_data                                             │
│  ├─ Mount: /data                                        │
│  ├─ Service: Redis                                      │
│  └─ Contents: RDB snapshots, AOF log                    │
│                                                         │
│  elasticsearch_data                                     │
│  ├─ Mount: /usr/share/elasticsearch/data              │
│  ├─ Service: Elasticsearch                             │
│  └─ Contents: Search indices, shards                    │
│                                                         │
│  qdrant_data                                            │
│  ├─ Mount: /qdrant/storage                            │
│  ├─ Service: Qdrant                                    │
│  └─ Contents: Vector collections                       │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         Bind Mounts (from local filesystem)             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ nginx.conf                                              │
│ ├─ Local: ./proxy/nginx.conf                           │
│ ├─ Container: /etc/nginx/nginx.conf:ro                │
│ └─ Read-only: True (immutable)                         │
│                                                         │
│ Database Migrations                                     │
│ ├─ Local: ./server/src/main/resources/db/migration    │
│ ├─ Container: /flyway/sql                             │
│ └─ Used by: Flyway migrations                         │
│                                                         │
│ Seed Data                                               │
│ ├─ Local: ./server/src/main/resources/db/seed         │
│ ├─ Container: /seed                                    │
│ └─ Used by: Seed data loading                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 6. Service Dependencies

```
                   ┌─────────────────┐
                   │  tasksense_nginx │
                   │  (No depends)    │
                   └────────┬─────────┘
                            │ depends_on
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
            ┌────────┐  ┌──────────┐  ┌──────────┐
            │ spring │  │ frontend │  │    ai    │
            └───┬────┘  └──────────┘  └─────┬────┘
                │ depends_on                 │
                ├─────────────────────────────┤
                │                             │
        ┌───────┴────────────────────┬────────┴─────┐
        │                            │              │
        ▼                            ▼              ▼
    ┌────────────┐          ┌─────────────┐  ┌──────────┐
    │ postgres   │          │ elasticsearch│  │ qdrant   │
    │ (healthy)  │          │ (healthy)    │  │ (no dep) │
    └────────────┘          └─────────────┘  └──────────┘
        │                            │
        └─────────┬──────────────────┘
                  ▼
            ┌──────────┐
            │  redis   │
            │(healthy) │
            └──────────┘
```

## 7. Environment Configuration Flow

```
┌─────────────────────────────────────────────────────┐
│            .env (Local Environment)                 │
├─────────────────────────────────────────────────────┤
│ GOOGLE_CLIENT_ID=xxx                                │
│ OPENAI_API_KEY=xxx                                  │
│ EMAIL_USERNAME=xxx                                  │
│ ...                                                 │
└────────────────┬────────────────────────────────────┘
                 │ docker-compose reads
                 ▼
    ┌──────────────────────────────────┐
    │ docker-compose.yaml              │
    │ ├─ services:                     │
    │ │  ├─ spring:                    │
    │ │  │  └─ environment: ${VAR}     │
    │ │  ├─ ai:                        │
    │ │  │  └─ environment: ${VAR}     │
    │ │  └─ frontend:                  │
    │ │     └─ environment: ${VAR}     │
    │ └─ volumes:                      │
    │    └─ nginx.conf:/etc/nginx...   │
    └────────┬─────────────────────────┘
             │ passes to
             ▼
    ┌──────────────────────────────────┐
    │  Container Environment           │
    │  ├─ Spring: SPRING_* vars        │
    │  ├─ AI: OPENAI_API_KEY, etc.     │
    │  └─ Frontend: VITE_* vars        │
    └──────────────────────────────────┘
```

## 8. Health Check Status

```
All containers run health checks:

Spring Backend:
└─ Test: curl -f http://localhost:8080/api/v1/health/status
   Interval: 30s | Timeout: 10s | Retries: 3 | Start Period: 40s

AI Service:
└─ Test: curl -f http://localhost:8000/health
   Interval: 30s | Timeout: 10s | Retries: 3 | Start Period: 30s

Nginx:
└─ Test: wget --spider http://localhost/health
   Interval: 30s | Timeout: 10s | Retries: 3

Frontend:
└─ Test: curl -f http://localhost:5173
   Interval: 30s | Timeout: 10s | Retries: 3 | Start Period: 30s

PostgreSQL:
└─ Test: pg_isready -U postgres
   Interval: 5s | Timeout: 5s | Retries: 5

Redis:
└─ Test: redis-cli ping
   Interval: 5s | Timeout: 5s | Retries: 5

Elasticsearch:
└─ Test: curl -s http://localhost:9200/_cluster/health
   Interval: 10s | Timeout: 5s | Retries: 5

Qdrant:
└─ Test: curl -f http://localhost:6333/health
   Interval: 10s | Timeout: 5s | Retries: 5
```

## 9. Logging & Monitoring

```
┌─────────────────────────────────────────────┐
│      Container Logs (docker logs)           │
├─────────────────────────────────────────────┤
│                                             │
│  docker-compose logs -f                     │
│  ├─ All services                            │
│  └─ Follow mode (tail -f)                   │
│                                             │
│  docker-compose logs -f spring              │
│  ├─ Spring Backend only                     │
│  └─ Real-time monitoring                    │
│                                             │
│  docker-compose logs --tail 100 ai          │
│  ├─ Last 100 lines of AI service            │
│  └─ Historical view                         │
│                                             │
│  docker stats                               │
│  ├─ Real-time resource usage                │
│  │  └─ CPU%, Memory%, I/O                   │
│  └─ All running containers                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

**These diagrams represent the complete TaskSense Docker infrastructure.**
Use them as reference when troubleshooting or explaining the system architecture.
