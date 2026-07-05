# TaskSense System Installation Instructions

## Table of contents

- [1. System architecture overview](#1-tổng-quan-kiến-trúc-hệ-thống)
- [2. Hardware requirements](#2-yêu-cầu-phần-cứng)
- [3. Software requirements](#3-yêu-cầu-phần-mềm)
- [4. Install necessary tools](#4-cài-đặt-các-công-cụ-cần-thiết)
  - [4.1. Java Development Kit (JDK 21)](#41-java-development-kit-jdk-21)
  - [4.2. Node.js](#42-nodejs)
  - [4.3. Python](#43-python)
  - [4.4. Docker Desktop](#44-docker-desktop)
  - [4.5. Git](#45-git)
- [5. Download source code](#5-tải-mã-nguồn)
- [6. Configure environment variables](#6-cấu-hình-biến-môi-trường)
  - [6.1. Set up Google OAuth 2.0](#61-thiết-lập-google-oauth-20)
  - [6.2. Set up Gmail SMTP](#62-thiết-lập-gmail-smtp)
  - [6.3. Set API Key for AI service](#63-thiết-lập-api-key-cho-dịch-vụ-ai)
  - [6.4. Create environment variable file](#64-tạo-file-biến-môi-trường)
- [7. Deploy the development environment (Development)](#7-triển-khai-môi-trường-phát-triển-development)
  - [7.1. Starting infrastructure with Docker Compose](#71-khởi-động-hạ-tầng-với-docker-compose)
  - [7.2. Start Backend (Spring Boot)](#72-khởi-động-backend-spring-boot)
  - [7.3. Start AI service (FastAPI)](#73-khởi-động-dịch-vụ-ai-fastapi)
  - [7.4. Start Frontend (React + Vite)](#74-khởi-động-frontend-react--vite)
  - [7.5. System Check](#75-kiểm-tra-hệ-thống)
- [8. Deploy production environment (Docker)](#8-triển-khai-môi-trường-production-docker)
  - [8.1. Configure environment variables](#81-cấu-hình-biến-môi-trường)
  - [8.2. Boot the entire system](#82-khởi-động-toàn-bộ-hệ-thống)
  - [8.3. Check the status of services](#83-kiểm-tra-trạng-thái-các-dịch-vụ)
- [9. Sample account and seed data](#9-tài-khoản-mẫu-và-dữ-liệu-seed)
- [10. Troubleshooting common problems](#10-xử-lý-sự-cố-thường-gặp)

---

## 1. System architecture overview

The TaskSense system is a smart project management web application, built according to a microservices architecture, including the following main components:

| Ingredients | Technology | Description | Default Gateway |
|---|---|---|---|
| **Frontend** | React 19, Vite, TypeScript, TailwindCSS | SPA User Interface | `5173` |
| **Backend API** | Spring Boot 4, Java 21, JPA, Flyway | The system's main REST API | `8080` |
| **AI Service** | FastAPI, Python 3.13, LangChain | AI chatbot service (RAG-based) | `8000` |
| **PostgreSQL** | PostgreSQL 16 | Primary Relational Database | `5432` |
| **Redis** | Redis 7 | Caching and session management | `6379` |
| **Elasticsearch** | Elasticsearch 9.0 | Full-text search engine | `9200` |
| **Qdrant** | Qdrant (latest) | Vector database for RAG | `6333` |
| **Nginx** | Nginx Alpine | Reverse proxy (only used in production) | `80` |

General architectural diagram:

```
                        ┌─────────────┐
                        │   Nginx     │ :80
                        │  (Reverse   │
                        │   Proxy)    │
                        └──────┬──────┘
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ Frontend │    │ Backend  │    │    AI    │
        │ React+   │    │ Spring   │    │ FastAPI  │
        │ Vite     │    │ Boot     │    │ LangChain│
        │ :5173    │    │ :8080    │    │ :8000    │
        └──────────┘    └────┬─────┘    └────┬─────┘
                             │               │
               ┌─────────────┼───────────────┤
               ▼             ▼               ▼
        ┌──────────┐  ┌──────────┐    ┌──────────┐
        │PostgreSQL│  │  Redis   │    │ Qdrant   │
        │  :5432   │  │  :6379   │    │  :6333   │
        └──────────┘  └──────────┘    └──────────┘
                             │
                      ┌──────────┐
                      │Elastic-  │
                      │search    │
                      │  :9200   │
                      └──────────┘
```

---

## 2. Hardware requirements

The following table lists the minimum and recommended hardware configuration to run the TaskSense system:

| Parameters | Minimum | Recommendations |
|---|---|---|
| **CPU** | 4 cores | 8 cores or more |
| **RAM** | 8 GB | 16 GB or more |
| **Hard Drive** | 20 GB free | 50 GB SSD or more |
| **Operating system** | Windows 10/11 (64-bit), macOS 12+, or Ubuntu 22.04+ | Windows 11, macOS 14+, or Ubuntu 24.04 |
| **Network connection** | Internet connection available | Stable bandwidth |

> **Note:** Elasticsearch and Docker services consume significant RAM resources. On systems with 8 GB of RAM, it is recommended to close unnecessary applications before booting.

---

## 3. Software requirements

The following table lists the software that needs to be installed before deploying the system:

| Software | Required version | Purpose |
|---|---|---|
| **JDK** | 21 and up | Compile and run Backend (Spring Boot) |
| **Node.js** | 20 LTS or more | Running Frontend (React + Vite) |
| **npm** | 10 or later (includes Node.js) | JavaScript Package Manager |
| **Python** | 3.13 and up | Run AI service (FastAPI) |
| **uv** | Latest version | Python virtual environment and package management |
| **Docker Desktop** | 4.x or higher | Containerization of infrastructure services |
| **Docker Compose** | v2 (included with Docker Desktop) | Coordination of containers |
| **Git** | 2.x or higher | Source Code Management |

---

## 4. Install necessary tools

### 4.1. Java Development Kit (JDK 21)

**Step 1:** Download JDK 21 from the Eclipse Adoptium homepage:

```
https://adoptium.net/temurin/releases/?version=21
```

Select the appropriate version for your operating system (Windows x64 `.msi`, macOS `.pkg`, or Linux `.tar.gz`).

**Step 2:** Run the installer and select the **"Set JAVA_HOME variable"** option during the installation process.

**Step 3:** Confirm successful installation:

```bash
java -version
```

Expected results:

```
openjdk version "21.0.x" ...
```

### 4.2. Node.js

**Step 1:** Download Node.js 20 LTS from the homepage:

```
https://nodejs.org/
```

Select **LTS** (Long Term Support) version.

**Step 2:** Run the installer with default options.

**Step 3:** Confirm successful installation:

```bash
node -v
npm -v
```

Expected results:

```
v20.x.x
10.x.x
```

### 4.3. Python

**Step 1:** Download Python 3.13 from the homepage:

```
https://www.python.org/downloads/
```

**Step 2:** Run the installer. **Required** check the option **"Add Python to PATH"** before clicking Install.

**Step 3:** Confirm successful installation:

```bash
python --version
```

Expected results:

```
Python 3.13.x
```

**Step 4:** Install `uv` — a high-performance Python package manager:

- On **Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

- On **macOS/Linux**:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Confirmation:

```bash
uv --version
```

### 4.4. Docker Desktop

**Step 1:** Download Docker Desktop from the homepage:

```
https://www.docker.com/products/docker-desktop/
```

**Step 2:** Run the installer with default options.

- On **Windows**: Make sure the **WSL 2** (Windows Subsystem for Linux) feature is enabled. Docker Desktop will automatically install if it isn't already there.
- On **macOS**: Select the version appropriate to the chip (Apple Silicon or Intel).

**Step 3:** Start Docker Desktop and wait until the Docker icon in the taskbar changes to the "Running" state.

**Step 4:** Confirm successful installation:

```bash
docker --version
docker compose version
```

Expected results:

```
Docker version 27.x.x, build ...
Docker Compose version v2.x.x
```

> **Docker Desktop configuration:** Go to **Settings → Resources** and make sure to allocate at least **4 GB RAM** and **2 CPU** for Docker.

### 4.5. Git

**Step 1:** Download Git from the homepage:

```
https://git-scm.com/downloads
```

**Step 2:** Install with default options.

**Step 3:** Confirm installation:

```bash
git --version
```

---

## 5. Download source code

Clone repository from source code management system:

```bash
git clone https://github.com/Alro127/TaskSense.git
cd TaskSense
```

Directory structure after cloning:

```
TaskSense/
├── client/          # Frontend (React + Vite + TypeScript)
├── server/          # Backend  (Spring Boot + Java 21)
├── ai/              # Dịch vụ AI (FastAPI + LangChain)
├── proxy/           # Reverse proxy (Nginx)
├── infra/           # Cấu hình Docker production
│   └── docker/
│       ├── compose.yaml        # Docker Compose production
│       └── compose.build.yaml  # Build images
├── docs/            # Tài liệu dự án
├── .env.example     # Mẫu biến môi trường
└── ...
```

---

## 6. Configure environment variables

The TaskSense system uses environment variables to configure connections between services and integration with external services. This section explains how to set up each necessary group of environment variables.

### 6.1. Set up Google OAuth 2.0

The system uses Google OAuth 2.0 to authenticate users who log in with a Google account.

**Step 1:** Access Google Cloud Console:

```
https://console.cloud.google.com/
```

**Step 2:** Create a new project (or select an existing project).

**Step 3:** Enable **Google People API**:
- Go to **APIs & Services → Library**
- Search for "Google People API" and click **Enable**

**Step 4:** Create OAuth 2.0 Credentials:
- Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
- Select Application type: **Web application**
- Add **Authorized JavaScript origins**: `http://localhost:5173`
- Add **Authorized redirect URIs**: `http://localhost:5173`
- Click **Create** and enter **Client ID** and **Client Secret**

**Step 5:** Configure OAuth consent screen:
- Go to **APIs & Services → OAuth consent screen**
- Select User Type: **External**
- Fill in application information and add necessary scopes (email, profile)

### 6.2. Set up Gmail SMTP

The system uses Gmail SMTP to send notifications and authenticate emails.

**Step 1:** Log in to your Google account at:

```
https://myaccount.google.com/
```

**Step 2:** Enable Two-Factor Authentication if not already enabled:
- Go to **Security → 2-Step Verification → Get started**

**Step 3:** Create App Password:
- Go to **Security → 2-Step Verification → App passwords**
- Select app: **Mail**, select device: **Other (Custom name)** → name "TaskSense"
- Click **Generate** and copy the generated 16-character app password

### 6.3. Set up API Key for AI service

AI Services supports multiple LLM providers. Just configure **one** of the following providers:

**Option 1 — OpenAI:**

- Access: `https://platform.openai.com/api-keys`
- Create new API key
- Set `LLM_PROVIDER=openai`

**Option 2 — Google Gemini:**

- Access: `https://aistudio.google.com/app/apikey`
- Create new API key
- Set `LLM_PROVIDER=gemini`

**Option 3 — OpenRouter (free):**

- Access: `https://openrouter.ai/keys`
- Create new API key
- Set `LLM_PROVIDER=openrouter`

### 6.4. Create environment variable file

Copy the sample file and edit according to actual configuration:

```bash
cp .env.example .env
```

Open file `.env` and update the following values:

```properties
# ═══════════════════════════════════════════════════════════
# Cấu hình Backend (Spring Boot)
# ═══════════════════════════════════════════════════════════

# Khóa bí mật JWT — Sử dụng chuỗi ngẫu nhiên dài, tối thiểu 32 ký tự
SECURITY_JWT_SECRET=thay-bang-chuoi-bi-mat-ngau-nhien-dai

# Google OAuth 2.0
GOOGLE_CLIENT_ID=<Client ID từ bước 6.1>
GOOGLE_CLIENT_SECRET=<Client Secret từ bước 6.1>
GOOGLE_REDIRECT_URL=http://localhost:5173

# Cấu hình Email (Gmail SMTP)
EMAIL_USERNAME=<email@gmail.com>
EMAIL_PASSWORD=<App Password 16 ký tự từ bước 6.2>

# ═══════════════════════════════════════════════════════════
# Cấu hình dịch vụ AI
# ═══════════════════════════════════════════════════════════

# Nhà cung cấp LLM: openai, gemini, hoặc openrouter
LLM_PROVIDER=openai

# API Key (chỉ cần điền key tương ứng với LLM_PROVIDER đã chọn)
OPENAI_API_KEY=sk-...
# GEMINI_API_KEY=...
# OPENROUTER_API_KEY=...

# ═══════════════════════════════════════════════════════════
# Cấu hình Frontend
# ═══════════════════════════════════════════════════════════

VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=<Client ID giống GOOGLE_CLIENT_ID ở trên>

# ═══════════════════════════════════════════════════════════
# Cấu hình cơ sở dữ liệu (giá trị mặc định cho môi trường development)
# ═══════════════════════════════════════════════════════════

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=taskdb
```

> **Important:** The `SECURITY_JWT_SECRET` value must be **the same** between Backend and AI Service to ensure token validation works properly.

In addition to the `.env` file in the root directory, it is necessary to create an additional `.env` file for the Frontend:

```bash
cp client/.env.example client/.env
```

Contents of file `client/.env`:

```properties
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=<Client ID từ bước 6.1>
```

---

## 7. Deploy the development environment (Development)

This section guides on deploying the system in a development environment, where infrastructure services (PostgreSQL, Redis, Elasticsearch, Qdrant) run in Docker containers, and applications (Backend, Frontend, AI Service) run directly on the development machine for convenient debugging.

### 7.1. Start your infrastructure with Docker Compose

Make sure Docker Desktop is running, then move into the `server/` directory and start the infrastructure services:

```bash
cd server
docker compose up -d postgres redis elasticsearch qdrant
```

The above command will initialize 4 containers:

| Containers | Image | Function |
|---|---|---|
| `task_postgres` | `postgres:16` | PostgreSQL Database |
| `task_redis` | `redis:7` | Redis Caching |
| `tasksense_es` | `elasticsearch:9.0.0` | Elasticsearch |
| `tasksense_qdrant` | `qdrant/qdrant:latest` | Qdrant vector database |

Wait about 30–60 seconds for all services to be ready. Check status:

```bash
docker compose ps
```

Make sure all containers are in state `healthy` or `running`.

**(Optional)** Launch additional administrative tools:

```bash
# pgAdmin — Giao diện quản trị PostgreSQL (truy cập tại http://localhost:5050)
docker compose up -d pgadmin

# Kibana — Giao diện quản trị Elasticsearch (truy cập tại http://localhost:5601)
docker compose up -d kibana
```

### 7.2. Backend Boot (Spring Boot)

**Step 1:** Open a new terminal, move to the `server/` folder:

```bash
cd server
```

**Step 2:** (First time) Compile and download dependencies:

- On **Windows**:

```powershell
.\mvnw.cmd -DskipTests compile
```

- On **macOS/Linux**:

```bash
./mvnw -DskipTests compile
```

This process may take 3–5 minutes at first due to the need to load dependent libraries.

**Step 3:** Start the application:

- On **Windows**:

```powershell
.\mvnw.cmd spring-boot:run
```

- On **macOS/Linux**:

```bash
./mvnw spring-boot:run
```

When booting successfully, the log will display:

```
Started TaskSense in X.XXX seconds
```

Backend API available at: `http://localhost:8080/api/v1`

Swagger UI API Documentation: `http://localhost:8080/api/v1/swagger-ui`

> **Note:** Flyway will automatically execute migration scripts to create the database schema when the Backend first starts.

### 7.3. Start AI service (FastAPI)

**Step 1:** Open a new terminal, move to the `ai/` folder:

```bash
cd ai
```

**Step 2:** Create virtual environment and install dependencies using `uv`:

```bash
uv sync
```

**Step 3:** Start the service:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

When booting successfully, the log will display:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     TaskSense AI Service starting — provider=..., qdrant=...
```

AI Service is available at: `http://localhost:8000`

Check health check: `http://localhost:8000/health`

### 7.4. Start Frontend (React + Vite)

**Step 1:** Open a new terminal, move to the `client/` folder:

```bash
cd client
```

**Step 2:** Install dependencies:

```bash
npm install
```

This process may take 2–3 minutes at first.

**Step 3:** Start the development server:

```bash
npm run dev
```

Display results:

```
  VITE v7.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

**Step 4:** Open a browser and access:

```
http://localhost:5173
```

### 7.5. Check the system

After all services have started, perform the following checks to ensure the system is operating properly:

| Services | Test URL | Expected results |
|---|---|---|
| Frontend | `http://localhost:5173` | Show TaskSense login page |
| Backend API | `http://localhost:8080/api/v1/health` | Returns health check status |
| Swagger UI | `http://localhost:8080/api/v1/swagger-ui` | Show API documentation |
| AI Service | `http://localhost:8000/health` | `{"status": "ok"}` |
| PostgreSQL | `localhost:5432` | Successful connection (using pgAdmin or CLI) |
| Redis | `localhost:6379` | `PONG` response when running `redis-cli ping` |
| Elasticsearch | `http://localhost:9200` | Returns cluster information |
| Qdrant | `http://localhost:6333/dashboard` | Display Qdrant dashboard |

**(Optional)** Load sample data for testing. Run the following command to execute the seed data file:

```bash
cd server
docker compose up seed
```

This command will initiate Flyway migration (if not already running) and load sample data into the database. See details about the sample account at [Section 9](#9-tài-khoản-mẫu-và-dữ-liệu-seed).

---

## 8. Deploy production environment (Docker)

This method deploys the **entire** system (including applications and infrastructure) in a Docker container, suitable for staging or production environments.

### 8.1. Configure environment variables

Create file `.env` in folder `infra/docker/`:

```bash
cd infra/docker
cp ../../.env.example .env
```

Edit file `.env` with actual production values. **Required** to set the following values:

```properties
# Bắt buộc
SECURITY_JWT_SECRET=<chuỗi-bí-mật-ngẫu-nhiên-tối-thiểu-64-ký-tự>

# Google OAuth
GOOGLE_CLIENT_ID=<Client ID>
GOOGLE_CLIENT_SECRET=<Client Secret>

# LLM Provider
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Google Client ID cho Frontend
VITE_GOOGLE_CLIENT_ID=<Client ID>
```

### 8.2. Boot the entire system

Move into the `infra/docker/` directory and run:

```bash
cd infra/docker
docker compose up -d --build
```

This command will perform the following steps in order:

1. **Build** Docker images for Backend, AI Service and Frontend
2. **Start** PostgreSQL, Redis, Elasticsearch, Qdrant
3. **Run** Flyway migration to create the database schema
4. **Load** seed data (if configured)
5. **Start** Backend Spring Boot API
6. **Start** AI Service (FastAPI)
7. **Start** Frontend (served by `serve`)
8. **Start** Nginx reverse proxy

The entire process may take **5–10 minutes** the first time.

Once complete, the entire system is accessible via **a single port**:

```
http://localhost
```

Nginx will automatically route requests:

| Path | Destination Service |
|---|---|
| `/` | Frontend (React) |
| `/api/core/v1/*` | Backend API (Spring Boot) |
| `/api/chat/v1/*` | AI Service (FastAPI) |

### 8.3. Check the status of services

```bash
docker compose ps
```

Expected result — all services in state `Up` or `healthy`:

```
NAME                  STATUS
tasksense_postgres    Up (healthy)
tasksense_redis       Up (healthy)
tasksense_es          Up (healthy)
tasksense_qdrant      Up (healthy)
tasksense_flyway      Exited (0)
tasksense_seed        Exited (0)
tasksense_spring_api  Up (healthy)
tasksense_ai          Up (healthy)
tasksense_client      Up
tasksense_nginx       Up
```

> **Note:** It is normal for `tasksense_flyway` and `tasksense_seed` to be in the `Exited (0)` state — they are one-shot containers that initialize the database.

View logs for a specific service:

```bash
docker compose logs -f tasksense-spring-api
docker compose logs -f tasksense-ai
docker compose logs -f tasksense-client
```

Stop the entire system:

```bash
docker compose down
```

Stop and **delete all data** (volumes):

```bash
docker compose down -v
```

---

## 9. Sample accounts and seed data

The system comes with a sample data file (`seed_data.sql`) for testing. After loading the seed data, the following accounts are ready to use:

| Email | Password | Full name | Role |
|---|---|---|---|
| `alice@example.com` | `password` | Alice Nguyen | Full-stack developer & tech lead |
| `bob@example.com` | `password` | Bob Tran | Project manager |
| `carol@example.com` | `password` | Carol Le | Frontend developer |
| `dave@example.com` | `password` | Dave Pham | Backend developer |
| `eve@example.com` | `password` | Eve Hoang | QA engineer |

> **Warning:** Absolutely **do not** use seed data and default passwords on a real production environment.

---

## 10. Troubleshooting common problems

### 10.1. Error Elasticsearch not starting

**Symptom:** Container `tasksense_es` keeps restarting or exiting with an error.

**Cause:** Elasticsearch requires a minimum `vm.max_map_count` value of 262144.

**Solution:**

- On **Linux/WSL2**:

```bash
sudo sysctl -w vm.max_map_count=262144
```

To apply permanently, add the following line to `/etc/sysctl.conf`:

```
vm.max_map_count=262144
```

- On **Windows** (runs in WSL2 terminal):

```bash
wsl -d docker-desktop -u root
sysctl -w vm.max_map_count=262144
```

- On **macOS** (Docker Desktop): Usually no changes are needed, Docker Desktop handles it itself.

### 10.2. Port already in use error (Port already in use)

**Symptoms:** Error message "port is already allocated" or "address already in use".

**Solution:**

- Check the process using the port:

  - On **Windows**:

  ```powershell
  netstat -ano | findstr :<PORT>
  taskkill /PID <PID> /F
  ```

  - On **macOS/Linux**:

  ```bash
  lsof -i :<PORT>
  kill -9 <PID>
  ```

- Or change the port in the corresponding configuration file.

### 10.3. Error connecting to database from Backend

**Symptoms:** Backend log shows `Connection refused` to PostgreSQL.

**Solution:**

1. Make sure the PostgreSQL container is running: `docker compose ps`
2. Check PostgreSQL is ready: `docker exec task_postgres pg_isready -U postgres`
3. Make sure port 5432 is not blocked by the firewall

### 10.4. Frontend cannot connect to Backend

**Symptoms:** The interface displays a network error when calling the API.

**Solution:**

1. Check file `client/.env` has the correct value `VITE_API_BASE_URL`
2. Make sure the Backend is running at the configured port
3. Check the browser is not blocked by CORS policy
4. Restart Frontend after changing file `.env`:

```bash
# Dừng dev server (Ctrl+C) rồi chạy lại
npm run dev
```

### 10.5. AI service is not responding

**Symptom:** Chatbot API returns error 500 or timeout.

**Solution:**

1. Check that the LLM provider's API key is configured correctly
2. Check running Qdrant: `http://localhost:6333/dashboard`
3. View detailed logs of AI services:

```bash
# Nếu chạy development
# Kiểm tra terminal đang chạy uvicorn

# Nếu chạy Docker
docker compose logs -f tasksense-ai
```

### 10.6. Docker build error failed

**Symptom:** `docker compose up --build` fails with build error.

**Solution:**

1. Delete Docker cache and rebuild:

```bash
docker compose build --no-cache
docker compose up -d
```

2. Ensure enough hard drive space (Docker image can take up several GB)
3. Check stable Internet connection (need to download base image and dependencies)

### 10.7. Error "SECURITY_JWT_SECRET is required"

**Symptoms:** Docker compose fails to start, showing required variable error.

**Solution:** Make sure the file `.env` has been created in the correct location and contains the value `SECURITY_JWT_SECRET`. For production deployment, the `.env` file must be in the `infra/docker/` directory.