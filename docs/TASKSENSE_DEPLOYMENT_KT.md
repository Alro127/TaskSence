# TaskSense Deployment KT

Tài liệu này là knowledge transfer cho việc setup và deploy TaskSense lên server. Nội dung dựa trên source hiện tại của repo, đặc biệt là `client/`, `server/`, `ai/`, `infra/docker/`, `proxy/`, `.github/workflows/main.yml` và các docs Docker trong `docs/`.

Đối tượng chính của tài liệu là người chưa có nhiều kiến thức về deployment, Docker, reverse proxy hoặc Kubernetes. Vì vậy tài liệu đi từ khái niệm nền tảng trước, sau đó mới đến lệnh triển khai và plan cải tiến.

## 0. Cách học và cách dùng tài liệu này

Nếu người nhận KT chưa quen lĩnh vực DevOps/deployment, nên đi theo thứ tự này:

1. Đọc phần `1. Mental model từ con số 0` để hiểu app chạy như thế nào.
2. Đọc phần `2. Tổng quan hệ thống` để biết TaskSense có những thành phần nào.
3. Đọc phần `3. Các file deployment quan trọng` để biết cần mở file nào khi debug.
4. Đọc phần `4. Cấu hình runtime cần biết` để hiểu env nào quyết định behavior.
5. Làm theo phần `5. Setup server bằng Docker Compose` cho path deploy dễ nhất.
6. Đọc phần `6. Mapping Docker Compose sang Kubernetes` nếu đã biết hoặc đang học K8s.
7. Dùng phần `7. Plan triển khai lên Kubernetes` và `8. Improvement plan` làm roadmap.
8. Khi go-live, dùng checklist ở cuối tài liệu thay vì nhớ bằng kinh nghiệm cá nhân.

Quy ước đọc:

- `container`: một process/app chạy trong môi trường đóng gói bởi Docker.
- `image`: bản build có thể chạy thành container.
- `service`: trong Compose/K8s là tên logic của một thành phần app.
- `host`: máy server thật hoặc VM/cloud instance.
- `internal port`: port container dùng trong network nội bộ.
- `public port`: port người dùng bên ngoài truy cập.
- `env`: biến môi trường, dùng để cấu hình app mà không sửa code.
- `secret`: env nhạy cảm như password, token, API key.

Gợi ý chia buổi KT:

| Buổi | Mục tiêu | Nội dung nên cover | Kết quả cần đạt |
| --- | --- | --- | --- |
| Buổi 1 | Hiểu app chạy như thế nào | Mental model, kiến trúc TaskSense, Docker/Compose/Nginx/env | Người học vẽ lại được request flow và liệt kê service chính |
| Buổi 2 | Tự deploy bằng Compose | Chuẩn bị server, `.env`, build/up/log/healthcheck/debug | Người học tự chạy được stack và biết xem log |
| Buổi 3 | Hiểu production/K8s roadmap | Mapping Compose -> K8s, migration, secrets, storage, rollout, rollback | Người học hiểu vì sao cần K8s và plan triển khai từng phase |
| Buổi 4 | Vận hành và xử lý sự cố | Checklist go-live, troubleshooting, backup, observability, improvement plan | Người học biết kiểm tra app sống/chết và đề xuất bước tiếp theo |

Không nên bắt đầu bằng Kubernetes manifest ngay. Với người chưa có nền tảng, nên bắt đầu bằng Compose vì Compose thể hiện cùng một hệ thống nhưng ít khái niệm hơn.

## 1. Mental model từ con số 0

### 1.1. Deploy một web app nghĩa là gì?

Khi chạy local trong lúc dev, developer thường chạy nhiều lệnh riêng:

```text
Frontend: npm run dev
Backend:  ./mvnw spring-boot:run
AI:       uvicorn app.main:app
DB:       docker run postgres...
```

Deploy lên server nghĩa là biến các lệnh rời rạc đó thành một hệ thống ổn định:

```text
Người dùng
  -> Domain/HTTP/HTTPS
  -> Reverse proxy
  -> Frontend/API/AI
  -> Database/cache/search/vector DB
```

Một deployment tốt cần trả lời được:

- App chạy ở đâu?
- Người dùng gọi vào URL nào?
- Request được route tới service nào?
- Dữ liệu lưu ở đâu?
- Secret lấy từ đâu?
- Khi service chết thì tự restart không?
- Làm sao biết app đang healthy?
- Khi deploy bản mới lỗi thì rollback thế nào?

### 1.2. Vì sao cần Docker?

Docker giúp đóng gói app và runtime vào image. Ví dụ:

- Spring API cần Java 21 và file jar.
- Frontend cần build static bundle từ Node/Vite.
- AI service cần Python, uv, FastAPI dependencies.

Nếu không dùng Docker, mỗi server phải cài đúng Java, Node, Python, package, path, env. Khi dùng Docker, server chỉ cần Docker và image đã build sẵn.

Mapping đơn giản:

```text
Source code + Dockerfile -> docker build -> image -> docker run -> container
```

Trong TaskSense:

| App | Dockerfile | Image chạy ra container |
| --- | --- | --- |
| Spring API | `server/Dockerfile` | `tasksense-spring-api` |
| Frontend | `client/Dockerfile` | `tasksense-client` |
| AI | `ai/app/Dockerfile` | `tasksense-ai` |
| Nginx | `proxy/Dockerfile` | `tasksense-nginx` |

### 1.3. Vì sao cần Docker Compose?

TaskSense không phải một container đơn lẻ. Nó cần nhiều service chạy cùng nhau:

- Frontend
- Spring API
- AI API
- Nginx
- Postgres
- Redis
- Elasticsearch
- Qdrant
- Flyway migration job
- Seed job

Docker Compose là cách mô tả toàn bộ stack này trong một file YAML. Với Compose, thay vì chạy từng container thủ công, ta chạy:

```bash
docker compose -f infra/docker/compose.yaml up -d
```

Compose sẽ tạo network, volume, container, healthcheck và dependency theo file `infra/docker/compose.yaml`.

### 1.4. Vì sao cần Nginx/reverse proxy?

Browser chỉ nên biết một domain public, ví dụ:

```text
https://tasksense.example.com
```

Nhưng bên trong có nhiều service:

```text
client: 5173
spring: 8080
ai:     8000
```

Nginx đứng phía trước để route:

```text
/                 -> frontend
/api/core/v1/*    -> Spring API
/api/chat/v1/*    -> AI API
```

Nếu không có reverse proxy, người dùng sẽ phải nhớ nhiều URL/port khác nhau, CORS phức tạp hơn, và việc thêm HTTPS/WebSocket routing khó kiểm soát hơn.

### 1.5. Vì sao cần Postgres, Redis, Elasticsearch, Qdrant?

Mỗi storage phục vụ một loại dữ liệu khác nhau:

| Thành phần | Dễ hiểu là | TaskSense dùng để |
| --- | --- | --- |
| PostgreSQL | Database chính | Lưu user, workspace, project, task, comment, workflow |
| Redis | Bộ nhớ nhanh/cache/pubsub | Cache, notification/event support, AI cache |
| Elasticsearch | Search engine | Search/index dữ liệu nghiệp vụ |
| Qdrant | Vector database | AI/RAG tìm dữ liệu theo embedding/ngữ nghĩa |

Không nên gộp tất cả vào một database vì mỗi loại tối ưu cho một kiểu truy vấn khác nhau.

### 1.6. Vì sao cần Flyway?

Backend dùng JPA nhưng `ddl-auto=validate`, nghĩa là Hibernate chỉ kiểm tra schema, không tự sửa database. Schema được quản lý bằng Flyway migration trong:

```text
server/src/main/resources/db/migration
```

Khi deploy, Flyway chạy migration trước để database có đúng table/column/index mà Spring API cần.

Nếu quên migration:

- App có thể start fail vì thiếu table/column.
- Hoặc app chạy nhưng một API bị lỗi runtime khi query DB.

### 1.7. K8s khác Compose ở đâu?

Docker Compose phù hợp để chạy full stack trên một server hoặc staging nhỏ. Kubernetes phù hợp khi cần:

- nhiều node/server;
- tự healing/reschedule khi container chết;
- scale nhiều replica;
- rolling update/rollback tốt hơn;
- secret/config/ingress/observability chuẩn hóa hơn;
- quản trị production lâu dài.

Mental model:

```text
Docker Compose service  -> Kubernetes Deployment/StatefulSet + Service
Docker volume           -> Kubernetes PVC
Docker network          -> Kubernetes Service DNS + NetworkPolicy
Docker env              -> Kubernetes ConfigMap/Secret
Nginx container         -> Kubernetes Ingress/Ingress Controller
Flyway one-shot service -> Kubernetes Job
```

## 2. Tổng quan hệ thống

TaskSense là monorepo gồm 3 app runtime chính và các service hạ tầng:

| Thành phần | Source | Runtime | Port nội bộ | Vai trò |
| --- | --- | --- | --- | --- |
| Frontend | `client/` | React 19 + Vite + TypeScript, serve static build | `5173` | UI người dùng |
| Core API | `server/` | Spring Boot, Java 21 | `8080` | REST API, auth, WebSocket, business logic |
| AI API | `ai/` | FastAPI + Uvicorn | `8000` | Chat/RAG, agent mode, Qdrant sync |
| Reverse proxy | `proxy/` | Nginx | `80` | Public entrypoint, route frontend/API/AI |
| Database | external/container | PostgreSQL 16 | `5432` | Primary data store |
| Cache/pubsub | external/container | Redis 7 | `6379` | Cache, notification/event support, AI cache |
| Search | external/container | Elasticsearch 9 | `9200` | Search index |
| Vector DB | external/container | Qdrant | `6333` | AI vector retrieval |
| Migration | container job | Flyway 9 | n/a | Run schema migrations |
| Seed | container job | Postgres client | n/a | Load seed data, optional/non-production |

Public request flow trong Docker deployment hiện tại:

```text
Browser
  -> Nginx :80
    -> /                 -> tasksense-client:5173
    -> /api/core/v1/*    -> tasksense-spring-api:8080/api/v1/*
    -> /api/chat/v1/*    -> tasksense-ai:8000/api/v1/*
```

WebSocket notification đi qua:

```text
Browser ws://<host>/api/core/v1/ws
  -> Nginx
    -> Spring /api/v1/ws
      -> STOMP /user/queue/notifications
```

## 3. Các file deployment quan trọng

| File | Ý nghĩa |
| --- | --- |
| `infra/docker/compose.yaml` | Compose chính cho full stack: Postgres, Redis, Elasticsearch, Flyway, seed, Spring, Qdrant, AI, client, Nginx |
| `infra/docker/compose.build.yaml` | Override image name/tag cho build/push GHCR; hiện chỉ khai báo image cho Spring API, AI và client |
| `server/compose.yaml` | Local backend/dev infra compose, không phải baseline production chính |
| `server/Dockerfile` | Multi-stage build Java 21, package jar bằng Maven, runtime JRE |
| `client/Dockerfile` | Build Vite static bundle bằng Node 20, serve trên port `5173` |
| `ai/app/Dockerfile` | Python 3.13 + uv, chạy `uvicorn app.main:app` |
| `proxy/nginx.conf` | Reverse proxy routing `/api/core/v1` và `/api/chat/v1` |
| `.env.example` | Template env root, có một số biến cũ cần điều chỉnh khi dùng production |
| `.github/workflows/main.yml` | CI/CD hiện tại bằng self-hosted runner + GHCR + Docker Compose |

### 3.1. Source of truth trong `infra/docker`

Khi deploy full stack, ưu tiên đọc `infra/docker/compose.yaml` trước. File này là source of truth cho topology hiện tại.

Networks đang khai báo:

| Network | Internal? | Dùng cho | Ý nghĩa vận hành |
| --- | --- | --- | --- |
| `tasksense_database_net` | Có | Postgres, Redis, Elasticsearch, Flyway, seed, Spring, Qdrant, AI | Mạng nội bộ cho database/cache/search/vector; không public ra ngoài |
| `tasksense_net` | Không | Spring, Qdrant, AI, client, Nginx | Mạng app/proxy; Nginx dùng mạng này để gọi app |

Volumes đang khai báo:

| Volume | Container path | Dùng bởi | Ghi chú |
| --- | --- | --- | --- |
| `tasksense_pg_data` | `/var/lib/postgresql/data` | Postgres | Dữ liệu database chính |
| `tasksense_redis_data` | `/data` | Redis | Redis append-only persistence |
| `tasksense_es_data` | `/usr/share/elasticsearch/data` | Elasticsearch | Search index data |
| `tasksense_qdrant_data` | `/qdrant/storage` | Qdrant | Vector data cho AI/RAG |
| `tasksense_nginx_cert` | `/etc/nginx/ssl` | Nginx | Chỗ để cert nếu mở rộng TLS trong Nginx |

Services trong `infra/docker/compose.yaml`:

| Service | Build/image hiện tại | Network | Public port? | Healthcheck |
| --- | --- | --- | --- | --- |
| `tasksense-postgres` | `postgres:16` | database | Không | `pg_isready` |
| `tasksense-redis` | `redis:7-alpine` | database | Không | `redis-cli ping` |
| `tasksense-elasticsearch` | `docker.elastic.co/elasticsearch/elasticsearch:9.0.0` | database | Không | `_cluster/health` |
| `tasksense-flyway` | `flyway/flyway:9-alpine` | database | Không | One-shot job, chờ Postgres healthy |
| `tasksense-seed` | `postgres:16-alpine` | database | Không | One-shot seed, phụ thuộc Flyway |
| `tasksense-spring-api` | build từ `server/Dockerfile` | app + database | Không | `http://localhost:8080/api/v1/health` |
| `tasksense-qdrant` | `qdrant/qdrant:latest` | app + database | Không | `http://localhost:6333/health` |
| `tasksense-ai` | build từ `ai/app/Dockerfile` | app + database | Không | `http://localhost:8000/health` |
| `tasksense-client` | build từ `client/Dockerfile` | app | Không | Chưa có healthcheck trong compose |
| `tasksense-nginx` | build từ `proxy/Dockerfile` | app | `80:80` | Chưa có healthcheck trong compose |

Image registry override trong `infra/docker/compose.build.yaml` hiện chỉ có:

```text
tasksense-spring-api -> ${IMAGE_PREFIX}-spring-api:${IMAGE_TAG}
tasksense-ai         -> ${IMAGE_PREFIX}-ai:${IMAGE_TAG}
tasksense-client     -> ${IMAGE_PREFIX}-client:${IMAGE_TAG}
```

Vì vậy khi dùng `compose.build.yaml`, chỉ nên kỳ vọng 3 image này được push/pull qua registry. Nginx hiện vẫn build từ `proxy/Dockerfile` trong compose chính, trừ khi sau này bổ sung thêm `tasksense-nginx.image` vào override.

## 4. Cấu hình runtime cần biết

### 4.1. Spring Boot API

Backend context path là:

```yaml
server.servlet.context-path: /api/v1
```

Các endpoint vận hành chính:

| Endpoint qua container | Endpoint qua Nginx | Mục đích |
| --- | --- | --- |
| `GET /api/v1/health` | `GET /api/core/v1/health` | Custom health API, trả `ApiResponse<HealthResponse>` |
| `GET /api/v1/actuator/health` | `GET /api/core/v1/actuator/health` | Spring Actuator health |
| `GET /api/v1/actuator/prometheus` | `GET /api/core/v1/actuator/prometheus` | Prometheus metrics |
| `GET /api/v1/swagger-ui` | `GET /api/core/v1/swagger-ui` | Swagger UI |
| `GET /api/v1/api-docs` | `GET /api/core/v1/api-docs` | OpenAPI JSON |
| `WS /api/v1/ws` | `WS /api/core/v1/ws` | STOMP WebSocket |

Các biến môi trường quan trọng cho Spring:

| Biến | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `SECURITY_JWT_SECRET` | Có | Dùng chung với AI để validate JWT. Phải là secret dài, random |
| `SPRING_DATASOURCE_URL` | Có | Trong compose trỏ tới `tasksense-postgres` |
| `SPRING_DATASOURCE_USERNAME` | Có | User database |
| `SPRING_DATASOURCE_PASSWORD` | Có | Password database |
| `SPRING_DATA_REDIS_HOST` | Có | Trong compose là `tasksense-redis` |
| `SPRING_DATA_REDIS_PORT` | Có | Mặc định `6379` |
| `SPRING_ELASTICSEARCH_URIS` hoặc `ELASTICSEARCH_URIS` | Có | Trong compose hiện dùng `SPRING_ELASTICSEARCH_URIS` |
| `EMAIL_USERNAME`, `EMAIL_PASSWORD` | Nếu dùng email | Gmail SMTP/app password hoặc SMTP tương thích config hiện tại |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL` | Nếu dùng Google OAuth | Redirect phải khớp domain frontend |
| `AWS_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_BUCKET`, `AWS_ENDPOINT` | Nếu dùng upload media/S3 | Code build presigned URL từ config này |

### 4.2. Frontend

`client/src/config/config.ts` đọc các biến build-time:

| Biến | Ý nghĩa | Giá trị khi đi qua Nginx |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL cho Spring API | `http://<domain>/api/core/v1` hoặc `/api/core/v1` nếu same-origin |
| `VITE_API_AGENT_BASE_URL` | Base URL cho AI API | `http://<domain>/api/chat/v1` hoặc `/api/chat/v1` nếu same-origin |
| `VITE_WS_URL` | WebSocket URL | `ws://<domain>/api/core/v1/ws` hoặc `wss://<domain>/api/core/v1/ws` |
| `VITE_GOOGLE_CLIENT_ID` | Google client id browser-side | Public OAuth client id |

Lưu ý: frontend dùng `VITE_API_AGENT_BASE_URL` cho AI API. `.env.example` hiện đã được chuẩn hóa theo tên biến này.

Vì Vite inject biến tại build time, thay đổi các biến `VITE_*` cần rebuild image frontend.

Sai lầm phổ biến với frontend:

- Sửa `.env` sau khi image frontend đã build nhưng không rebuild image.
- Dùng `http://localhost...` trong production. Với browser của người dùng, `localhost` là máy của người dùng, không phải server.
- Dùng `ws://` khi site chạy HTTPS. Site HTTPS cần WebSocket `wss://`.

### 4.3. AI API

AI service mount router dưới `/api/v1`, còn health/readiness nằm ở root:

| Endpoint nội bộ | Endpoint qua Nginx | Mục đích |
| --- | --- | --- |
| `GET /health` | Chưa route riêng trong Nginx hiện tại | Basic health |
| `GET /ready` | Chưa route riêng trong Nginx hiện tại | Readiness: JWT secret, Qdrant, Postgres |
| `/api/v1/*` | `/api/chat/v1/*` | Chat/session API |

Các biến quan trọng:

| Biến | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `SECURITY_JWT_SECRET` | Có | Phải giống Spring |
| `BACKEND_URL` | Có | Trong compose: `http://tasksense-spring-api:8080/api/v1` |
| `SPRING_MCP_ENDPOINT` | Có nếu dùng agent/MCP | Trong compose: `http://tasksense-spring-api:8080/api/v1/mcp` |
| `LLM_PROVIDER` | Có | Code hỗ trợ `openai`, `gemini`, `openrouter`, `siliconflow`; compose default hiện là `openai` |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `SILICONFLOW_API_KEY` | Tùy provider | Cần key tương ứng provider |
| `LLM_EMBEDDING_PROVIDER` | Có nếu dùng sync embedding | Compose default hiện là `openrouter` |
| `QDRANT_HOST` | Có | Compose: `http://tasksense-qdrant:6333` |
| `REDIS_URL` | Nên có | Compose: `redis://tasksense-redis:6379` |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_SSLMODE` | Có | AI đọc DB để sync source truth |
| `CORS_ORIGINS` | Có | Domain frontend được phép gọi AI |
| `ENABLE_SYNC`, `SYNC_INTERVAL_MINUTES`, `SYNC_BATCH_SIZE` | Tùy nhu cầu | Điều khiển scheduler sync dữ liệu vào Qdrant |

## 5. Setup server bằng Docker Compose

Đây là path triển khai nhanh nhất vì repo đã có Dockerfile và compose đầy đủ.

Trước khi chạy lệnh, cần hiểu 3 việc:

1. `docker compose build` tạo image từ source code.
2. `docker compose up -d` tạo/chạy container ở background.
3. `docker compose logs -f <service>` dùng để đọc log khi service lỗi.

Nếu người nhận KT chưa quen terminal, nên chạy từng lệnh một và đọc output. Không nên copy cả block dài chạy một lần trong lần đầu học.

### 5.0. Checklist kiến thức trước khi thao tác

Người vận hành nên phân biệt được các khái niệm sau:

| Khái niệm | Cách hiểu đơn giản | Ví dụ trong TaskSense |
| --- | --- | --- |
| Repository | Nơi chứa source code | Folder `TaskSense/` |
| Server/VM | Máy thật hoặc máy ảo để chạy app | Ubuntu cloud instance |
| Docker image | Bản đóng gói app | image của `tasksense-spring-api` |
| Docker container | App đang chạy từ image | container `tasksense_spring_api` |
| Docker volume | Ổ đĩa bền cho container | `postgres_data`, `qdrant_data` |
| Docker network | Mạng riêng để container gọi nhau bằng tên service | `tasksense_net`, `tasksense_database_net` |
| Environment variable | Config truyền từ ngoài vào app | `SECURITY_JWT_SECRET`, `POSTGRES_PASSWORD` |
| Secret | Env nhạy cảm không được commit | JWT secret, DB password, API key |
| Healthcheck | Cách kiểm tra service còn sống không | `curl /health` |
| Migration | Script nâng schema database | `V1__init_schema.sql` ... `V15__add_chat_tables.sql` |

Khi giải thích cho người mới, có thể dùng hình dung này:

```text
Image giống "bản cài đặt".
Container giống "chương trình đang chạy".
Volume giống "ổ cứng không bị mất khi restart container".
Network giống "mạng LAN riêng giữa các container".
Env giống "file cấu hình được truyền vào lúc chạy".
```

### 5.1. Chuẩn bị server

Server cần:

- Linux server có Docker Engine và Docker Compose plugin.
- Tối thiểu nên có 4 vCPU, 8 GB RAM cho full stack dev/staging; production nên tách managed DB/search/vector nếu traffic tăng.
- Mở inbound port `80`; nếu dùng HTTPS thì mở thêm `443`.
- Có quyền login GHCR nếu dùng image từ GitHub Container Registry.
- DNS trỏ domain về server nếu dùng domain thật.

Lệnh kiểm tra nhanh trên server:

```bash
docker --version
docker compose version
free -h
df -h
```

Ý nghĩa:

- `docker --version`: server đã cài Docker chưa.
- `docker compose version`: có Compose plugin chưa.
- `free -h`: RAM còn đủ không, đặc biệt vì Elasticsearch và AI tốn RAM.
- `df -h`: disk còn đủ không, đặc biệt vì Postgres/Qdrant/Elasticsearch có volume.

Nếu chưa có Docker, cài theo hướng dẫn chính thức của Docker hoặc script chuẩn của team infra. Không nên cài Docker bằng nhiều nguồn lẫn lộn trên cùng một server.

### 5.2. Chuẩn bị env

Tạo `.env` ở root repo trên server:

```bash
cp .env.example .env
```

File `.env.example` đã được chuẩn hóa theo `infra/docker/compose.yaml`. Sau khi copy sang `.env`, chuẩn bị đủ các nhóm bên dưới.

#### 5.2.1. Env bắt buộc cho mọi deployment

```bash
SECURITY_JWT_SECRET=<long-random-secret>

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=taskdb
```

| Biến | Dùng bởi | Vì sao quan trọng |
| --- | --- | --- |
| `SECURITY_JWT_SECRET` | Spring API + AI | Hai service cùng validate JWT. Nếu lệch nhau, auth/AI request có thể fail |
| `POSTGRES_USER` | Postgres, Flyway, Spring, AI, seed | User DB dùng xuyên suốt stack |
| `POSTGRES_PASSWORD` | Postgres, Flyway, Spring, AI, seed | Với compose hiện tại phải giữ `postgres`, vì Flyway/seed/Spring đang hardcode password này |
| `POSTGRES_DB` | Postgres, Flyway, Spring, AI, seed | Tên database. Default hiện là `taskdb` |

Lưu ý quan trọng: theo yêu cầu không chỉnh Docker Compose file, `infra/docker/compose.yaml` hiện vẫn hardcode `postgres` cho Flyway, seed và Spring datasource. Vì vậy nếu chạy trực tiếp compose hiện tại, hãy giữ:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=taskdb
```

Nếu muốn dùng password mạnh ở production, cần tạo compose override hoặc một bước chỉnh infra riêng để Postgres/Flyway/seed/Spring/AI cùng dùng chung credential. Không chỉ đổi `.env`, vì như vậy Postgres đổi password nhưng Spring/Flyway vẫn dùng `postgres` và deployment sẽ fail.

#### 5.2.2. Env cho domain public và frontend build

Với domain thật, ví dụ `https://tasksense.example.com`, chuẩn bị:

```bash
VITE_API_BASE_URL=https://tasksense.example.com/api/core/v1
VITE_API_AGENT_BASE_URL=https://tasksense.example.com/api/chat/v1
VITE_WS_URL=wss://tasksense.example.com/api/core/v1/ws
VITE_GOOGLE_CLIENT_ID=<google-client-id>

GOOGLE_REDIRECT_URL=https://tasksense.example.com
CORS_ORIGINS=https://tasksense.example.com
```

| Biến | Dùng bởi | Ghi chú |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend build | Browser gọi Spring API qua Nginx |
| `VITE_API_AGENT_BASE_URL` | Frontend build | Browser gọi AI API qua Nginx |
| `VITE_WS_URL` | Frontend build | Browser mở notification WebSocket |
| `VITE_GOOGLE_CLIENT_ID` | Frontend build | Public Google OAuth client id |
| `GOOGLE_REDIRECT_URL` | Spring API | Redirect URL server-side cho Google OAuth |
| `CORS_ORIGINS` | AI service | Origin frontend được phép gọi AI |

Vì Vite inject `VITE_*` tại build time, đổi các biến này phải rebuild `tasksense-client`.

Theo yêu cầu không chỉnh Docker Compose file, `infra/docker/compose.yaml` hiện vẫn hardcode các build args localhost:

```yaml
VITE_API_BASE_URL: http://localhost/api/core/v1
VITE_API_AGENT_BASE_URL: http://localhost/api/chat/v1
VITE_WS_URL: ws://localhost/api/core/v1/ws
```

Local test qua `http://localhost` có thể dùng default. Production HTTPS phải dùng `https://...` và `wss://...`.

Với CI hiện tại, workflow truyền `VITE_*` bằng `docker compose build --build-arg ... tasksense-client`, nên không cần sửa compose để build image frontend đúng domain. Nếu build thủ công trên server, dùng cùng build args hoặc tạo compose override riêng.

#### 5.2.3. Env cho Google OAuth

Nếu bật login Google:

```bash
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URL=https://tasksense.example.com
VITE_GOOGLE_CLIENT_ID=<google-client-id>
```

Checklist trên Google Cloud Console:

- Authorized JavaScript origins có `https://tasksense.example.com`.
- Authorized redirect URIs khớp flow backend/frontend hiện tại.
- `VITE_GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_ID` cùng client id nếu dùng cùng OAuth app.

Nếu không dùng Google OAuth ngay, vẫn có thể để trống nhưng các nút login Google sẽ không hoạt động đúng.

#### 5.2.4. Env cho email

Các flow register, OTP, forgot password, invite email cần SMTP:

```bash
EMAIL_USERNAME=<smtp-user-or-gmail-address>
EMAIL_PASSWORD=<smtp-password-or-gmail-app-password>
```

Code Spring hiện cấu hình Gmail SMTP:

```text
host=smtp.gmail.com
port=587
starttls=true
```

Nếu dùng Gmail, nên dùng App Password, không dùng password đăng nhập chính.

#### 5.2.5. Env cho S3/object storage

Upload avatar/document dùng presigned URL từ Spring:

```bash
AWS_REGION=<region>
AWS_ACCESS_KEY=<access-key>
AWS_SECRET_KEY=<secret-key>
AWS_BUCKET=<bucket>
AWS_ENDPOINT=<s3-endpoint-host>
```

Ví dụ AWS S3:

```bash
AWS_REGION=ap-southeast-1
AWS_BUCKET=tasksense-prod
AWS_ENDPOINT=s3.ap-southeast-1.amazonaws.com
```

Nếu dùng S3-compatible storage như MinIO/R2, `AWS_ENDPOINT` phải là endpoint tương thích của provider đó. Không thêm `https://` nếu code/provider hiện kỳ vọng host; kiểm tra lại bằng upload avatar/document sau deploy.

#### 5.2.6. Env cho AI/LLM/RAG

AI service cần provider cho chat và embedding:

```bash
LLM_PROVIDER=openai
LLM_EMBEDDING_PROVIDER=openrouter

OPENAI_API_KEY=<openai-key>
OPENROUTER_API_KEY=<openrouter-key-if-used-for-embedding>
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
SILICONFLOW_API_KEY=

QDRANT_API_KEY=
ENABLE_SYNC=True
```

Theo `infra/docker/compose.yaml` hiện tại:

| Biến | Default trong infra | Ghi chú |
| --- | --- | --- |
| `LLM_PROVIDER` | `openai` | Provider chat |
| `LLM_EMBEDDING_PROVIDER` | `openrouter` | Provider embedding |
| `OPENAI_MODEL` | `gpt-4.1` | Đang hardcode trong compose |
| `OPENROUTER_EMBEDDING_MODEL` | `nvidia/llama-nemotron-embed-vl-1b-v2:free` | Đang hardcode trong compose |
| `OPENROUTER_MODEL` | `nvidia/nemotron-3-super-120b-a12b:free` | Đang hardcode trong compose |
| `QDRANT_HOST` | `http://tasksense-qdrant:6333` | Internal service URL |
| `ENABLE_SYNC` | `True` | Bật scheduler sync dữ liệu vào Qdrant |

Nếu `LLM_EMBEDDING_PROVIDER=openrouter`, cần `OPENROUTER_API_KEY`. Nếu không có embedding key, AI RAG/sync có thể degraded hoặc fail tùy flow.

Lưu ý theo compose hiện tại: `tasksense-ai` đang truyền `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, nhưng chưa truyền `GEMINI_API_KEY` và `SILICONFLOW_API_KEY` vào container. Nếu muốn dùng `LLM_PROVIDER=gemini` hoặc `LLM_PROVIDER=siliconflow`, cần compose override hoặc một thay đổi infra riêng để map hai secret này vào AI container. Không chỉ thêm vào `.env`.

#### 5.2.7. Env cho registry/GHCR deployment

Chỉ cần khi dùng thêm `infra/docker/compose.build.yaml`:

```bash
IMAGE_PREFIX=ghcr.io/<owner>/<repo>
IMAGE_TAG=<git-sha-or-release-version>
```

Ví dụ:

```bash
IMAGE_PREFIX=ghcr.io/acme/tasksense
IMAGE_TAG=2026-06-05-a1b2c3d
```

`compose.build.yaml` hiện map:

```text
tasksense-spring-api -> ${IMAGE_PREFIX}-spring-api:${IMAGE_TAG}
tasksense-ai         -> ${IMAGE_PREFIX}-ai:${IMAGE_TAG}
tasksense-client     -> ${IMAGE_PREFIX}-client:${IMAGE_TAG}
```

#### 5.2.8. Full `.env` mẫu cho production

Mẫu này dùng domain `tasksense.example.com`; thay bằng domain thật:

```bash
SECURITY_JWT_SECRET=<long-random-secret>

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=taskdb

VITE_API_BASE_URL=https://tasksense.example.com/api/core/v1
VITE_API_AGENT_BASE_URL=https://tasksense.example.com/api/chat/v1
VITE_WS_URL=wss://tasksense.example.com/api/core/v1/ws
VITE_GOOGLE_CLIENT_ID=<google-client-id>

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URL=https://tasksense.example.com

EMAIL_USERNAME=<smtp-user>
EMAIL_PASSWORD=<smtp-password-or-app-password>

AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY=<access-key>
AWS_SECRET_KEY=<secret-key>
AWS_BUCKET=tasksense-prod
AWS_ENDPOINT=s3.ap-southeast-1.amazonaws.com

CORS_ORIGINS=https://tasksense.example.com

LLM_PROVIDER=openai
LLM_EMBEDDING_PROVIDER=openrouter
OPENAI_API_KEY=<openai-key>
OPENROUTER_API_KEY=<openrouter-key>
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
SILICONFLOW_API_KEY=

QDRANT_API_KEY=
ENABLE_SYNC=True

IMAGE_PREFIX=ghcr.io/<owner>/<repo>
IMAGE_TAG=<git-sha-or-release-version>
```

#### 5.2.9. Kiểm tra env trước khi deploy

Trước khi chạy `docker compose up`, kiểm tra:

```bash
docker compose -f infra/docker/compose.yaml config
```

Lệnh này render compose sau khi áp dụng `.env`. Dùng để bắt lỗi thiếu `SECURITY_JWT_SECRET`, sai syntax YAML, hoặc biến env chưa được thay.

Checklist:

```text
[ ] SECURITY_JWT_SECRET không còn là default
[ ] Nếu chạy base compose trực tiếp: POSTGRES_PASSWORD vẫn là postgres để khớp Flyway/seed/Spring hardcode
[ ] Nếu production cần password mạnh: đã có compose override hoặc infra change riêng cho toàn bộ DB consumers
[ ] VITE_API_BASE_URL là domain public đúng
[ ] VITE_API_AGENT_BASE_URL là domain public đúng
[ ] VITE_WS_URL dùng wss nếu frontend chạy HTTPS
[ ] GOOGLE_REDIRECT_URL đúng domain public
[ ] CORS_ORIGINS đúng origin frontend, không dư localhost ở production nếu không cần
[ ] EMAIL_USERNAME/EMAIL_PASSWORD đã test SMTP
[ ] AWS_* đã test upload avatar/document
[ ] OPENAI_API_KEY hoặc provider key tương ứng đã có
[ ] OPENROUTER_API_KEY đã có nếu dùng openrouter embedding
[ ] IMAGE_PREFIX/IMAGE_TAG đã set nếu dùng compose.build.yaml
```

Giải thích các nhóm env:

| Nhóm | Nếu cấu hình sai thì thường bị gì? |
| --- | --- |
| JWT secret | Login được nhưng AI/WebSocket/token validation có thể lỗi, hoặc toàn bộ auth không tin cậy |
| Database | Spring/AI không start hoặc lỗi query |
| Redis | Cache/notification/pubsub có thể lỗi |
| Elasticsearch | Search/index task/project/workflow lỗi hoặc degraded |
| Qdrant/LLM | AI chat/RAG không hoạt động đúng |
| Google OAuth | Login Google redirect sai hoặc không lấy được token |
| Email | Register/forgot password/invite email không gửi được |
| S3/AWS | Avatar/document upload presign lỗi |
| Frontend `VITE_*` | Browser gọi sai API URL, WebSocket không connect |

### 5.3. Build và chạy toàn bộ stack trên server

Từ root repo:

```bash
docker compose -f infra/docker/compose.yaml build
docker compose -f infra/docker/compose.yaml up -d
docker compose -f infra/docker/compose.yaml ps
```

Kết quả mong đợi:

- `tasksense-postgres`, `tasksense-redis`, `tasksense-elasticsearch`, `tasksense-qdrant` chạy trước.
- `tasksense-flyway` chạy xong rồi exit thành công.
- `tasksense-seed` có thể chạy xong rồi exit; production nên tách seed khỏi auto-run.
- `tasksense-spring-api`, `tasksense-ai` ở trạng thái running/healthy.
- `tasksense-client`, `tasksense-nginx` ở trạng thái running; hiện compose chưa khai báo healthcheck cho hai service này.

Theo dõi startup:

```bash
docker compose -f infra/docker/compose.yaml logs -f tasksense-postgres
docker compose -f infra/docker/compose.yaml logs -f tasksense-flyway
docker compose -f infra/docker/compose.yaml logs -f tasksense-spring-api
docker compose -f infra/docker/compose.yaml logs -f tasksense-ai
docker compose -f infra/docker/compose.yaml logs -f tasksense-nginx
```

Thứ tự debug khi service không lên:

1. Xem `docker compose -f infra/docker/compose.yaml ps`.
2. Xem log service bị lỗi: `docker compose -f infra/docker/compose.yaml logs -f <service>`.
3. Nếu Spring lỗi DB schema, xem `tasksense-flyway`.
4. Nếu AI lỗi readiness, kiểm tra `SECURITY_JWT_SECRET`, `QDRANT_HOST`, Postgres env và provider API key.
5. Nếu browser trắng hoặc API 404, kiểm tra `tasksense-nginx` và frontend `VITE_*`.
6. Nếu WebSocket không connect, kiểm tra `VITE_WS_URL`, Nginx upgrade header và Spring `/ws`.

Verify:

```bash
curl -f http://<server-or-domain>/api/core/v1/health
curl -f http://<server-or-domain>/api/core/v1/actuator/health
curl -f http://<server-or-domain>/api/core/v1/actuator/prometheus
curl -f http://<server-or-domain>/
```

AI health hiện chưa có Nginx route riêng trong `proxy/nginx.conf`. Verify từ container network:

```bash
docker compose -f infra/docker/compose.yaml exec tasksense-ai python - <<'PY'
import urllib.request
print(urllib.request.urlopen("http://localhost:8000/health", timeout=5).read().decode())
print(urllib.request.urlopen("http://localhost:8000/ready", timeout=5).read().decode())
PY
```

Nếu verify fail, đọc theo bảng này:

| Triệu chứng | Nơi kiểm tra trước | Nguyên nhân hay gặp |
| --- | --- | --- |
| `curl /api/core/v1/health` 502 | `tasksense-nginx`, `tasksense-spring-api` logs | Spring chưa healthy hoặc Nginx route sai |
| `curl /api/core/v1/health` 404 | `proxy/nginx.conf` | Sai path public/internal |
| Frontend mở được nhưng login fail | browser devtools Network, Spring logs | `VITE_API_BASE_URL` sai hoặc CORS/auth lỗi |
| AI chat fail | AI logs, `/ready` | Thiếu API key, Qdrant/Postgres không ready, JWT secret sai |
| Notification không realtime | browser console, Spring WebSocket logs | `VITE_WS_URL` sai, dùng `ws` thay vì `wss`, proxy WebSocket lỗi |
| Upload fail | Spring logs, AWS/S3 config | `AWS_ENDPOINT`, bucket hoặc credential sai |

### 5.4. Deploy bằng image registry/GHCR

Repo đã có `infra/docker/compose.build.yaml` để đặt image cho `tasksense-spring-api`, `tasksense-ai`, `tasksense-client`.

```bash
export IMAGE_PREFIX=ghcr.io/<owner>/<repo>
export IMAGE_TAG=<git-sha-or-version>

docker compose \
  -f infra/docker/compose.yaml \
  -f infra/docker/compose.build.yaml \
  build tasksense-spring-api tasksense-ai tasksense-client

docker compose \
  -f infra/docker/compose.yaml \
  -f infra/docker/compose.build.yaml \
  push tasksense-spring-api tasksense-ai tasksense-client
```

Trên server:

```bash
docker login ghcr.io

export IMAGE_PREFIX=ghcr.io/<owner>/<repo>
export IMAGE_TAG=<git-sha-or-version>

docker compose \
  -f infra/docker/compose.yaml \
  -f infra/docker/compose.build.yaml \
  pull tasksense-spring-api tasksense-ai tasksense-client

docker compose \
  -f infra/docker/compose.yaml \
  -f infra/docker/compose.build.yaml \
  up -d --remove-orphans
```

`.github/workflows/main.yml` hiện build/push/pull đúng 3 service có image override:

```text
tasksense-spring-api
tasksense-ai
tasksense-client
```

Nginx không đi qua registry ở cấu hình hiện tại. Nếu muốn Nginx cũng đi qua registry, cần thêm `tasksense-nginx.image` vào `infra/docker/compose.build.yaml`, rồi mới thêm `tasksense-nginx` vào workflow build/push/pull.

GitHub Actions cần chuẩn bị các `secrets` và `vars` sau.

Secrets:

```text
SECURITY_JWT_SECRET
POSTGRES_PASSWORD
EMAIL_USERNAME
EMAIL_PASSWORD
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
AWS_ACCESS_KEY
AWS_SECRET_KEY
QDRANT_API_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
OPENROUTER_API_KEY
GEMINI_API_KEY
SILICONFLOW_API_KEY
```

Vars:

```text
POSTGRES_USER
POSTGRES_DB
GOOGLE_REDIRECT_URL
VITE_API_BASE_URL
VITE_API_AGENT_BASE_URL
VITE_WS_URL
VITE_GOOGLE_CLIENT_ID
AWS_REGION
AWS_BUCKET
AWS_ENDPOINT
LLM_PROVIDER
LLM_EMBEDDING_PROVIDER
CORS_ORIGINS
ENABLE_SYNC
NGINX_SERVER_NAME
```

`VITE_*` phải có ở build job vì frontend image được build trong CI. Nếu thiếu hoặc để localhost, image frontend production sẽ gọi sai API dù deploy server đúng.

Giải thích flow GHCR cho người mới:

```text
Developer push code
  -> GitHub Actions build image
  -> Push image lên GHCR
  -> Server pull image mới
  -> docker compose up -d thay container cũ bằng container mới
```

Ưu điểm của cách này:

- Server không cần build từ source nếu chỉ pull image.
- Có thể rollback bằng image tag cũ.
- Mỗi deployment gắn với commit SHA rõ ràng.

Điểm cần nhớ:

- Image tag nên là commit SHA hoặc version bất biến, không nên chỉ dựa vào `latest`.
- Secret production không nên nằm trong image; secret phải truyền qua env/Secret khi chạy.
- Nếu frontend env đổi, image frontend phải build lại vì Vite inject env lúc build.

## 6. Mapping Docker Compose sang Kubernetes

Phần này giúp người quen Kubernetes hình dung Compose hiện tại sẽ map sang object nào.

Nếu người nhận KT chưa biết Kubernetes, đọc glossary này trước:

| K8s concept | Cách hiểu đơn giản | Tương ứng gần nhất trong Docker/Compose |
| --- | --- | --- |
| Namespace | Không gian riêng để gom tài nguyên | Project/environment boundary |
| Pod | Đơn vị chạy container nhỏ nhất | Một container hoặc nhóm container chạy cùng nhau |
| Deployment | Quản lý Pod stateless, rollout, rollback | Compose service cho app stateless |
| StatefulSet | Quản lý Pod có identity/storage ổn định | Compose service có volume quan trọng như DB |
| Service | DNS/load balancer nội bộ cho Pod | Tên service trong Docker network |
| Ingress | Luật route HTTP/HTTPS public vào service | Nginx reverse proxy |
| ConfigMap | Config không nhạy cảm | Env thường trong `.env` |
| Secret | Config nhạy cảm | Password, API key, JWT secret |
| PVC | Yêu cầu cấp storage bền | Docker named volume |
| Job | Chạy task một lần rồi kết thúc | Flyway/seed one-shot service |
| Probe | Healthcheck của Pod | Compose `healthcheck` |
| HPA | Tự tăng/giảm replica | Không có tương đương trực tiếp trong Compose |
| NetworkPolicy | Luật service nào được gọi service nào | Docker internal network, nhưng chi tiết hơn |

Bản chất cần nhớ:

```text
Compose chạy theo kiểu "một file mô tả nhiều container trên một server".
Kubernetes chạy theo kiểu "nhiều object mô tả desired state trong một cluster".
```

Trong Compose, `depends_on` giúp nói service nào chờ service nào. Trong K8s, không nên phụ thuộc vào thứ tự start cứng; thay vào đó dùng:

- readiness probe để service chỉ nhận traffic khi đã sẵn sàng;
- Job/initContainer cho migration;
- retry logic trong app;
- Service DNS ổn định để app gọi nhau.

| Docker Compose | Kubernetes tương đương | Ghi chú |
| --- | --- | --- |
| `tasksense-nginx` | `Ingress` + `Ingress Controller` hoặc `Deployment` Nginx riêng | Nên ưu tiên Ingress cho production |
| `tasksense-client` | `Deployment` + `Service` | Static frontend; có thể serve bằng Nginx image thay vì Node `serve` |
| `tasksense-spring-api` | `Deployment` + `Service` | Thêm liveness/readiness probes |
| `tasksense-ai` | `Deployment` + `Service` | Có readiness `/ready`; cần resource request/limit |
| `tasksense-postgres` | `StatefulSet` + `PVC` hoặc managed Postgres | Production nên dùng managed DB |
| `tasksense-redis` | `StatefulSet`/`Deployment` + `PVC` hoặc managed Redis | Nếu chỉ cache có thể dùng Deployment; nếu queue/persistence thì PVC |
| `tasksense-elasticsearch` | Operator/StatefulSet hoặc managed Elasticsearch/OpenSearch | Không nên tự viết manifest đơn giản cho production lớn |
| `tasksense-qdrant` | `StatefulSet` + `PVC` hoặc Qdrant Cloud | Cần storage ổn định |
| `tasksense-flyway` | `Job` hoặc init workflow trước app rollout | Chạy migration một lần trước khi Spring start |
| `tasksense-seed` | `Job` thủ công, chỉ staging/dev | Không nên auto seed production |
| `.env` | `ConfigMap` + `Secret` | Secret cho JWT, DB password, API keys |
| named volumes | `PersistentVolumeClaim` | Postgres/Redis/ES/Qdrant cần PVC |
| `depends_on` | readiness probe + initContainer/Job orchestration | K8s không có depends_on trực tiếp |
| internal network | `ClusterIP Service` + NetworkPolicy | Service discovery bằng DNS nội bộ |

Kubernetes service DNS dự kiến:

```text
tasksense-spring-api.<namespace>.svc.cluster.local:8080
tasksense-ai.<namespace>.svc.cluster.local:8000
tasksense-postgres.<namespace>.svc.cluster.local:5432
tasksense-redis.<namespace>.svc.cluster.local:6379
tasksense-elasticsearch.<namespace>.svc.cluster.local:9200
tasksense-qdrant.<namespace>.svc.cluster.local:6333
```

Ingress routing tương đương Nginx:

```text
https://<domain>/                 -> client Service
https://<domain>/api/core/v1/*    -> spring-api Service, rewrite to /api/v1/*
https://<domain>/api/chat/v1/*    -> ai Service, rewrite to /api/v1/*
wss://<domain>/api/core/v1/ws     -> spring-api Service, WebSocket enabled
```

## 7. Plan triển khai lên Kubernetes

### Phase 0: Chuẩn hóa trước khi viết manifest

1. Giữ CI khớp `infra/docker/compose.build.yaml`: build/push/pull đủ 3 image đang có override (`tasksense-spring-api`, `tasksense-ai`, `tasksense-client`). Nếu muốn Nginx cũng đi qua registry, bổ sung `tasksense-nginx.image` trước rồi mới build/push/pull 4 image.
2. Khi đổi domain, cập nhật `VITE_API_BASE_URL`, `VITE_API_AGENT_BASE_URL`, `VITE_WS_URL`, `GOOGLE_REDIRECT_URL`, `CORS_ORIGINS` trong `.env` trước khi build frontend.
3. Quyết định production data layer:
   - Khuyến nghị: managed Postgres, managed Redis, managed Elasticsearch/OpenSearch, managed Qdrant/Qdrant StatefulSet riêng.
   - Nếu tự host trong cluster: dùng StatefulSet + PVC + backup policy.
4. Tách seed khỏi auto production startup.
5. Quyết định domain và TLS: cert-manager + ClusterIssuer hoặc TLS từ cloud load balancer.

### Phase 1: K8s baseline cho app stateless

Tạo namespace:

```bash
kubectl create namespace tasksense
```

Tạo Secret:

```bash
kubectl -n tasksense create secret generic tasksense-secrets \
  --from-literal=SECURITY_JWT_SECRET='<secret>' \
  --from-literal=POSTGRES_PASSWORD='<password>' \
  --from-literal=EMAIL_PASSWORD='<password>' \
  --from-literal=GOOGLE_CLIENT_SECRET='<secret>' \
  --from-literal=AWS_SECRET_KEY='<secret>' \
  --from-literal=OPENAI_API_KEY='<key>'
```

Tạo ConfigMap cho config không nhạy cảm:

```bash
kubectl -n tasksense create configmap tasksense-config \
  --from-literal=POSTGRES_DB='taskdb' \
  --from-literal=POSTGRES_USER='postgres' \
  --from-literal=CORS_ORIGINS='https://<domain>' \
  --from-literal=GOOGLE_REDIRECT_URL='https://<domain>' \
  --from-literal=LLM_PROVIDER='openai'
```

Triển khai thứ tự:

1. Data services hoặc kết nối managed services.
2. Flyway `Job`.
3. Spring API `Deployment` + `Service`.
4. Qdrant/AI dependencies.
5. AI `Deployment` + `Service`.
6. Client `Deployment` + `Service`.
7. Ingress/TLS.

### Phase 2: Probe, resources, autoscaling

Spring API:

- liveness: `GET /api/v1/actuator/health/liveness` hoặc `GET /api/v1/health`
- readiness: `GET /api/v1/actuator/health/readiness`
- metrics: `GET /api/v1/actuator/prometheus`

AI:

- liveness: `GET /health`
- readiness: `GET /ready`

Resource baseline đề xuất để bắt đầu:

| Workload | Requests | Limits |
| --- | --- | --- |
| Spring API | `500m CPU`, `768Mi RAM` | `2 CPU`, `1536Mi RAM` |
| AI API | `500m CPU`, `1Gi RAM` | `2 CPU`, `2Gi RAM` |
| Client | `100m CPU`, `128Mi RAM` | `500m CPU`, `512Mi RAM` |
| Qdrant | `500m CPU`, `1Gi RAM` | `2 CPU`, `4Gi RAM` |
| Elasticsearch | `1 CPU`, `2Gi RAM` | `2 CPU`, `4Gi RAM` |

Sau khi có metrics thật, bật HPA cho Spring và AI theo CPU/memory hoặc custom metrics.

### Phase 3: Observability và vận hành

1. Dùng Prometheus scrape Spring `/api/v1/actuator/prometheus`.
2. Thêm scrape cho Nginx/Ingress controller metrics.
3. Chuẩn hóa log aggregation: Loki, Elasticsearch, hoặc cloud logging.
4. Thêm dashboard Grafana:
   - request rate/error rate/latency Spring
   - JVM heap/GC/thread
   - Redis/DB connection pool
   - AI request latency/provider error
   - Qdrant/Elasticsearch health
5. Alert cơ bản:
   - API 5xx tăng cao
   - readiness fail
   - DB disk gần đầy
   - ES/Qdrant unavailable
   - AI provider quota/error rate

### Phase 4: Release strategy

1. Dùng image tag immutable theo commit SHA.
2. `kubectl rollout status deployment/tasksense-spring-api`.
3. Migration Flyway chạy trước rollout app mới.
4. Nếu schema thay đổi phá vỡ backward compatibility, dùng expand/contract migration:
   - release 1: add nullable/new columns
   - release 2: app dùng schema mới
   - release 3: cleanup old columns
5. Dùng blue/green hoặc canary nếu traffic production quan trọng.

## 8. Improvement plan đề xuất

### P0 - Cần làm trước production

- Quyết định rõ `tasksense-nginx` sẽ tiếp tục build local hay có image override riêng; hiện CI và `compose.build.yaml` đang khớp ở 3 image app: Spring, AI, client.
- Khi deploy domain thật, kiểm tra env frontend: `VITE_API_BASE_URL`, `VITE_API_AGENT_BASE_URL`, `VITE_WS_URL`, `VITE_GOOGLE_CLIENT_ID`.
- Không dùng default `postgres/postgres` và `SECURITY_JWT_SECRET=change-me...` ở production.
- Tắt hoặc tách `tasksense-seed` khỏi production compose.
- Thêm HTTPS/TLS cho Nginx hoặc chuyển sang cloud load balancer/Ingress.
- Thêm backup/restore procedure cho Postgres, Qdrant, Elasticsearch.
- Xem lại CORS: Nginx hiện add `Access-Control-Allow-Origin '*'`; production nên giới hạn domain thật nếu dùng credentials/token flows.

### P1 - Hạ tầng ổn định hơn

- Tách database/search/vector ra managed services hoặc StatefulSet có PVC và backup.
- Thêm resource limits trong Compose/K8s cho Spring, AI, ES, Qdrant.
- Dùng frontend runtime Nginx static image thay vì `node:20-alpine` + global `serve` để giảm footprint.
- Expose AI `/health` và `/ready` qua Nginx hoặc dùng trực tiếp trong K8s probes.
- Thêm healthcheck cho `tasksense-client` trong Compose nếu tiếp tục dùng Compose.
- Thêm smoke test sau deploy: frontend load, auth endpoint, `/health`, AI session endpoint, WebSocket connect.

### P2 - CI/CD và release quality

- Thêm frontend `npm run lint` và `npm run build` vào CI trước image build.
- Thêm backend `./mvnw -DskipTests compile` hoặc `./mvnw test` vào CI trước image build.
- Thêm AI `uv run pytest` vào CI.
- Dùng Trivy/Grype scan image trước push.
- Ký image hoặc dùng provenance nếu org yêu cầu supply-chain control.
- Tạo versioned release notes cho mỗi deployment.

### P3 - Kubernetes maturity

- Dùng Helm chart hoặc Kustomize overlays: `dev`, `staging`, `prod`.
- Dùng External Secrets Operator hoặc Sealed Secrets thay vì commit secret manifest.
- Dùng cert-manager cho TLS tự động.
- Thêm NetworkPolicy: chỉ Ingress gọi client/API/AI; chỉ app gọi DB/Redis/ES/Qdrant.
- Dùng PodDisruptionBudget cho Spring/AI khi replica > 1.
- Dùng HPA cho Spring/AI; cân nhắc KEDA nếu AI workload queue-based.
- Tách AI sync scheduler thành workload riêng nếu cần scale AI API nhiều replica để tránh nhiều scheduler chạy song song.

## 9. Checklist go-live

Trước khi public production:

```text
[ ] Domain/DNS trỏ đúng server hoặc load balancer
[ ] HTTPS hoạt động, WebSocket dùng wss
[ ] Frontend build với VITE_API_BASE_URL/VITE_API_AGENT_BASE_URL/VITE_WS_URL đúng domain
[ ] SECURITY_JWT_SECRET mạnh và giống nhau giữa Spring + AI
[ ] DB password mạnh, không dùng default
[ ] Flyway chạy thành công
[ ] Seed job không chạy ngoài ý muốn trên production
[ ] Spring /api/core/v1/health trả UP
[ ] Spring /api/core/v1/actuator/prometheus scrape được
[ ] AI /health và /ready OK từ network nội bộ
[ ] Login/register/OAuth/email flow đã test
[ ] Upload media/S3 presign đã test
[ ] Notification WebSocket đã test
[ ] Backup Postgres/Qdrant/ES đã cấu hình
[ ] Log/metrics/alert cơ bản đã cấu hình
[ ] Rollback command hoặc rollback plan đã chuẩn bị
```

## 10. Lệnh rollback nhanh

Docker Compose rollback về image tag trước:

```bash
export IMAGE_PREFIX=ghcr.io/<owner>/<repo>
export IMAGE_TAG=<previous-good-sha>

docker compose \
  -f infra/docker/compose.yaml \
  -f infra/docker/compose.build.yaml \
  pull tasksense-spring-api tasksense-ai tasksense-client

docker compose \
  -f infra/docker/compose.yaml \
  -f infra/docker/compose.build.yaml \
  up -d --remove-orphans
```

Kubernetes rollback:

```bash
kubectl -n tasksense rollout undo deployment/tasksense-spring-api
kubectl -n tasksense rollout undo deployment/tasksense-ai
kubectl -n tasksense rollout undo deployment/tasksense-client
```

Lưu ý: rollback app không rollback schema database. Với thay đổi DB, cần migration strategy tương thích ngược hoặc restore plan riêng.

## 11. Tài liệu liên quan trong repo

- `docs/DOCKER_INDEX.md`
- `docs/DOCKER_SETUP.md`
- `docs/DOCKER_COMMANDS.md`
- `docs/DOCKER_ARCHITECTURE.md`
- `docs/INFRASTRUCTURE_REVIEW.md`
- `client/PROJECT_CONTEXT.md`
- `server/src/main/resources/application.yaml`
- `ai/AI_SERVICE_GUIDE.md`
