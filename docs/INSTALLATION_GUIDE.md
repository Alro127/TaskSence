# Hướng Dẫn Cài Đặt Hệ Thống TaskSense

## Mục lục

- [1. Tổng quan kiến trúc hệ thống](#1-tổng-quan-kiến-trúc-hệ-thống)
- [2. Yêu cầu phần cứng](#2-yêu-cầu-phần-cứng)
- [3. Yêu cầu phần mềm](#3-yêu-cầu-phần-mềm)
- [4. Cài đặt các công cụ cần thiết](#4-cài-đặt-các-công-cụ-cần-thiết)
  - [4.1. Java Development Kit (JDK 21)](#41-java-development-kit-jdk-21)
  - [4.2. Node.js](#42-nodejs)
  - [4.3. Python](#43-python)
  - [4.4. Docker Desktop](#44-docker-desktop)
  - [4.5. Git](#45-git)
- [5. Tải mã nguồn](#5-tải-mã-nguồn)
- [6. Cấu hình biến môi trường](#6-cấu-hình-biến-môi-trường)
  - [6.1. Thiết lập Google OAuth 2.0](#61-thiết-lập-google-oauth-20)
  - [6.2. Thiết lập Gmail SMTP](#62-thiết-lập-gmail-smtp)
  - [6.3. Thiết lập API Key cho dịch vụ AI](#63-thiết-lập-api-key-cho-dịch-vụ-ai)
  - [6.4. Tạo file biến môi trường](#64-tạo-file-biến-môi-trường)
- [7. Triển khai môi trường phát triển (Development)](#7-triển-khai-môi-trường-phát-triển-development)
  - [7.1. Khởi động hạ tầng với Docker Compose](#71-khởi-động-hạ-tầng-với-docker-compose)
  - [7.2. Khởi động Backend (Spring Boot)](#72-khởi-động-backend-spring-boot)
  - [7.3. Khởi động dịch vụ AI (FastAPI)](#73-khởi-động-dịch-vụ-ai-fastapi)
  - [7.4. Khởi động Frontend (React + Vite)](#74-khởi-động-frontend-react--vite)
  - [7.5. Kiểm tra hệ thống](#75-kiểm-tra-hệ-thống)
- [8. Triển khai môi trường production (Docker)](#8-triển-khai-môi-trường-production-docker)
  - [8.1. Cấu hình biến môi trường](#81-cấu-hình-biến-môi-trường)
  - [8.2. Khởi động toàn bộ hệ thống](#82-khởi-động-toàn-bộ-hệ-thống)
  - [8.3. Kiểm tra trạng thái các dịch vụ](#83-kiểm-tra-trạng-thái-các-dịch-vụ)
- [9. Tài khoản mẫu và dữ liệu seed](#9-tài-khoản-mẫu-và-dữ-liệu-seed)
- [10. Xử lý sự cố thường gặp](#10-xử-lý-sự-cố-thường-gặp)

---

## 1. Tổng quan kiến trúc hệ thống

Hệ thống TaskSense là một ứng dụng web quản lý dự án thông minh, được xây dựng theo kiến trúc microservices, bao gồm các thành phần chính sau:

| Thành phần | Công nghệ | Mô tả | Cổng mặc định |
|---|---|---|---|
| **Frontend** | React 19, Vite, TypeScript, TailwindCSS | Giao diện người dùng SPA | `5173` |
| **Backend API** | Spring Boot 4, Java 21, JPA, Flyway | REST API chính của hệ thống | `8080` |
| **AI Service** | FastAPI, Python 3.13, LangChain | Dịch vụ chatbot AI (RAG-based) | `8000` |
| **PostgreSQL** | PostgreSQL 16 | Cơ sở dữ liệu quan hệ chính | `5432` |
| **Redis** | Redis 7 | Bộ nhớ đệm và quản lý phiên | `6379` |
| **Elasticsearch** | Elasticsearch 9.0 | Công cụ tìm kiếm toàn văn bản | `9200` |
| **Qdrant** | Qdrant (latest) | Cơ sở dữ liệu vector cho RAG | `6333` |
| **Nginx** | Nginx Alpine | Reverse proxy (chỉ dùng trong production) | `80` |

Sơ đồ kiến trúc tổng quan:

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

## 2. Yêu cầu phần cứng

Bảng sau liệt kê cấu hình phần cứng tối thiểu và khuyến nghị để chạy hệ thống TaskSense:

| Thông số | Tối thiểu | Khuyến nghị |
|---|---|---|
| **CPU** | 4 nhân (cores) | 8 nhân trở lên |
| **RAM** | 8 GB | 16 GB trở lên |
| **Ổ cứng** | 20 GB trống | 50 GB SSD trở lên |
| **Hệ điều hành** | Windows 10/11 (64-bit), macOS 12+, hoặc Ubuntu 22.04+ | Windows 11, macOS 14+, hoặc Ubuntu 24.04 |
| **Kết nối mạng** | Có kết nối Internet | Băng thông ổn định |

> **Lưu ý:** Elasticsearch và các dịch vụ Docker chiếm dụng đáng kể tài nguyên RAM. Trên hệ thống có 8 GB RAM, nên đóng các ứng dụng không cần thiết trước khi khởi động.

---

## 3. Yêu cầu phần mềm

Bảng sau liệt kê các phần mềm cần cài đặt trước khi triển khai hệ thống:

| Phần mềm | Phiên bản yêu cầu | Mục đích |
|---|---|---|
| **JDK** | 21 trở lên | Biên dịch và chạy Backend (Spring Boot) |
| **Node.js** | 20 LTS trở lên | Chạy Frontend (React + Vite) |
| **npm** | 10 trở lên (đi kèm Node.js) | Quản lý gói JavaScript |
| **Python** | 3.13 trở lên | Chạy dịch vụ AI (FastAPI) |
| **uv** | Phiên bản mới nhất | Quản lý gói và môi trường ảo Python |
| **Docker Desktop** | 4.x trở lên | Container hóa các dịch vụ hạ tầng |
| **Docker Compose** | v2 (đi kèm Docker Desktop) | Điều phối các container |
| **Git** | 2.x trở lên | Quản lý mã nguồn |

---

## 4. Cài đặt các công cụ cần thiết

### 4.1. Java Development Kit (JDK 21)

**Bước 1:** Tải JDK 21 từ trang chủ Eclipse Adoptium:

```
https://adoptium.net/temurin/releases/?version=21
```

Chọn phiên bản phù hợp với hệ điều hành (Windows x64 `.msi`, macOS `.pkg`, hoặc Linux `.tar.gz`).

**Bước 2:** Chạy trình cài đặt và chọn tùy chọn **"Set JAVA_HOME variable"** trong quá trình cài đặt.

**Bước 3:** Xác nhận cài đặt thành công:

```bash
java -version
```

Kết quả mong đợi:

```
openjdk version "21.0.x" ...
```

### 4.2. Node.js

**Bước 1:** Tải Node.js 20 LTS từ trang chủ:

```
https://nodejs.org/
```

Chọn phiên bản **LTS** (Long Term Support).

**Bước 2:** Chạy trình cài đặt với các tùy chọn mặc định.

**Bước 3:** Xác nhận cài đặt thành công:

```bash
node -v
npm -v
```

Kết quả mong đợi:

```
v20.x.x
10.x.x
```

### 4.3. Python

**Bước 1:** Tải Python 3.13 từ trang chủ:

```
https://www.python.org/downloads/
```

**Bước 2:** Chạy trình cài đặt. **Bắt buộc** đánh dấu tùy chọn **"Add Python to PATH"** trước khi nhấn Install.

**Bước 3:** Xác nhận cài đặt thành công:

```bash
python --version
```

Kết quả mong đợi:

```
Python 3.13.x
```

**Bước 4:** Cài đặt `uv` — trình quản lý gói Python hiệu năng cao:

- Trên **Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

- Trên **macOS/Linux**:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Xác nhận:

```bash
uv --version
```

### 4.4. Docker Desktop

**Bước 1:** Tải Docker Desktop từ trang chủ:

```
https://www.docker.com/products/docker-desktop/
```

**Bước 2:** Chạy trình cài đặt với các tùy chọn mặc định.

- Trên **Windows**: Đảm bảo tính năng **WSL 2** (Windows Subsystem for Linux) đã được bật. Docker Desktop sẽ tự động cài đặt nếu chưa có.
- Trên **macOS**: Chọn phiên bản phù hợp với chip (Apple Silicon hoặc Intel).

**Bước 3:** Khởi động Docker Desktop và chờ cho đến khi biểu tượng Docker ở thanh tác vụ chuyển sang trạng thái "Running".

**Bước 4:** Xác nhận cài đặt thành công:

```bash
docker --version
docker compose version
```

Kết quả mong đợi:

```
Docker version 27.x.x, build ...
Docker Compose version v2.x.x
```

> **Cấu hình Docker Desktop:** Vào **Settings → Resources** và đảm bảo cấp phát ít nhất **4 GB RAM** và **2 CPU** cho Docker.

### 4.5. Git

**Bước 1:** Tải Git từ trang chủ:

```
https://git-scm.com/downloads
```

**Bước 2:** Cài đặt với các tùy chọn mặc định.

**Bước 3:** Xác nhận cài đặt:

```bash
git --version
```

---

## 5. Tải mã nguồn

Clone repository từ hệ thống quản lý mã nguồn:

```bash
git clone https://github.com/Alro127/TaskSense.git
cd TaskSense
```

Cấu trúc thư mục sau khi clone:

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

## 6. Cấu hình biến môi trường

Hệ thống TaskSense sử dụng các biến môi trường để cấu hình kết nối giữa các dịch vụ và tích hợp với các dịch vụ bên ngoài. Phần này hướng dẫn cách thiết lập từng nhóm biến môi trường cần thiết.

### 6.1. Thiết lập Google OAuth 2.0

Hệ thống sử dụng Google OAuth 2.0 để xác thực người dùng đăng nhập bằng tài khoản Google.

**Bước 1:** Truy cập Google Cloud Console:

```
https://console.cloud.google.com/
```

**Bước 2:** Tạo một dự án mới (hoặc chọn dự án có sẵn).

**Bước 3:** Bật **Google People API**:
- Vào **APIs & Services → Library**
- Tìm kiếm "Google People API" và nhấn **Enable**

**Bước 4:** Tạo OAuth 2.0 Credentials:
- Vào **APIs & Services → Credentials → Create Credentials → OAuth client ID**
- Chọn Application type: **Web application**
- Thêm **Authorized JavaScript origins**: `http://localhost:5173`
- Thêm **Authorized redirect URIs**: `http://localhost:5173`
- Nhấn **Create** và ghi nhận **Client ID** và **Client Secret**

**Bước 5:** Cấu hình OAuth consent screen:
- Vào **APIs & Services → OAuth consent screen**
- Chọn User Type: **External**
- Điền thông tin ứng dụng và thêm các scope cần thiết (email, profile)

### 6.2. Thiết lập Gmail SMTP

Hệ thống sử dụng Gmail SMTP để gửi email thông báo và xác thực.

**Bước 1:** Đăng nhập vào tài khoản Google tại:

```
https://myaccount.google.com/
```

**Bước 2:** Bật xác thực 2 bước (Two-Factor Authentication) nếu chưa bật:
- Vào **Security → 2-Step Verification → Get started**

**Bước 3:** Tạo App Password:
- Vào **Security → 2-Step Verification → App passwords**
- Chọn app: **Mail**, chọn device: **Other (Custom name)** → đặt tên "TaskSense"
- Nhấn **Generate** và sao chép mật khẩu ứng dụng 16 ký tự được tạo ra

### 6.3. Thiết lập API Key cho dịch vụ AI

Dịch vụ AI hỗ trợ nhiều nhà cung cấp LLM. Chỉ cần cấu hình **một** trong các nhà cung cấp sau:

**Tùy chọn 1 — OpenAI:**

- Truy cập: `https://platform.openai.com/api-keys`
- Tạo API key mới
- Đặt `LLM_PROVIDER=openai`

**Tùy chọn 2 — Google Gemini:**

- Truy cập: `https://aistudio.google.com/app/apikey`
- Tạo API key mới
- Đặt `LLM_PROVIDER=gemini`

**Tùy chọn 3 — OpenRouter (miễn phí):**

- Truy cập: `https://openrouter.ai/keys`
- Tạo API key mới
- Đặt `LLM_PROVIDER=openrouter`

### 6.4. Tạo file biến môi trường

Sao chép file mẫu và chỉnh sửa theo cấu hình thực tế:

```bash
cp .env.example .env
```

Mở file `.env` và cập nhật các giá trị sau:

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

> **Quan trọng:** Giá trị `SECURITY_JWT_SECRET` phải **giống nhau** giữa Backend và AI Service để đảm bảo xác thực token hoạt động đúng.

Ngoài file `.env` ở thư mục gốc, cần tạo thêm file `.env` cho Frontend:

```bash
cp client/.env.example client/.env
```

Nội dung file `client/.env`:

```properties
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=<Client ID từ bước 6.1>
```

---

## 7. Triển khai môi trường phát triển (Development)

Phần này hướng dẫn triển khai hệ thống trong môi trường phát triển, nơi các dịch vụ hạ tầng (PostgreSQL, Redis, Elasticsearch, Qdrant) chạy trong Docker container, còn các ứng dụng (Backend, Frontend, AI Service) chạy trực tiếp trên máy phát triển để tiện gỡ lỗi.

### 7.1. Khởi động hạ tầng với Docker Compose

Đảm bảo Docker Desktop đang chạy, sau đó di chuyển vào thư mục `server/` và khởi động các dịch vụ hạ tầng:

```bash
cd server
docker compose up -d postgres redis elasticsearch qdrant
```

Lệnh trên sẽ khởi tạo 4 container:

| Container | Image | Chức năng |
|---|---|---|
| `task_postgres` | `postgres:16` | Cơ sở dữ liệu PostgreSQL |
| `task_redis` | `redis:7` | Bộ nhớ đệm Redis |
| `tasksense_es` | `elasticsearch:9.0.0` | Elasticsearch |
| `tasksense_qdrant` | `qdrant/qdrant:latest` | Cơ sở dữ liệu vector Qdrant |

Chờ khoảng 30–60 giây để tất cả dịch vụ sẵn sàng. Kiểm tra trạng thái:

```bash
docker compose ps
```

Đảm bảo tất cả container ở trạng thái `healthy` hoặc `running`.

**(Tùy chọn)** Khởi động thêm các công cụ quản trị:

```bash
# pgAdmin — Giao diện quản trị PostgreSQL (truy cập tại http://localhost:5050)
docker compose up -d pgadmin

# Kibana — Giao diện quản trị Elasticsearch (truy cập tại http://localhost:5601)
docker compose up -d kibana
```

### 7.2. Khởi động Backend (Spring Boot)

**Bước 1:** Mở terminal mới, di chuyển vào thư mục `server/`:

```bash
cd server
```

**Bước 2:** (Lần đầu tiên) Biên dịch và tải các dependency:

- Trên **Windows**:

```powershell
.\mvnw.cmd -DskipTests compile
```

- Trên **macOS/Linux**:

```bash
./mvnw -DskipTests compile
```

Quá trình này có thể mất 3–5 phút lần đầu do cần tải các thư viện phụ thuộc.

**Bước 3:** Khởi động ứng dụng:

- Trên **Windows**:

```powershell
.\mvnw.cmd spring-boot:run
```

- Trên **macOS/Linux**:

```bash
./mvnw spring-boot:run
```

Khi khởi động thành công, log sẽ hiển thị:

```
Started TaskSense in X.XXX seconds
```

Backend API sẵn sàng tại: `http://localhost:8080/api/v1`

Tài liệu API Swagger UI: `http://localhost:8080/api/v1/swagger-ui`

> **Lưu ý:** Flyway sẽ tự động thực thi các migration scripts để tạo schema cơ sở dữ liệu khi Backend khởi động lần đầu.

### 7.3. Khởi động dịch vụ AI (FastAPI)

**Bước 1:** Mở terminal mới, di chuyển vào thư mục `ai/`:

```bash
cd ai
```

**Bước 2:** Tạo môi trường ảo và cài đặt các dependency bằng `uv`:

```bash
uv sync
```

**Bước 3:** Khởi động dịch vụ:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

Khi khởi động thành công, log sẽ hiển thị:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     TaskSense AI Service starting — provider=..., qdrant=...
```

AI Service sẵn sàng tại: `http://localhost:8000`

Kiểm tra health check: `http://localhost:8000/health`

### 7.4. Khởi động Frontend (React + Vite)

**Bước 1:** Mở terminal mới, di chuyển vào thư mục `client/`:

```bash
cd client
```

**Bước 2:** Cài đặt các dependency:

```bash
npm install
```

Quá trình này có thể mất 2–3 phút lần đầu.

**Bước 3:** Khởi động development server:

```bash
npm run dev
```

Kết quả hiển thị:

```
  VITE v7.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

**Bước 4:** Mở trình duyệt và truy cập:

```
http://localhost:5173
```

### 7.5. Kiểm tra hệ thống

Sau khi tất cả dịch vụ đã khởi động, thực hiện kiểm tra sau để đảm bảo hệ thống hoạt động đúng:

| Dịch vụ | URL kiểm tra | Kết quả mong đợi |
|---|---|---|
| Frontend | `http://localhost:5173` | Hiển thị trang đăng nhập TaskSense |
| Backend API | `http://localhost:8080/api/v1/health` | Trả về trạng thái health check |
| Swagger UI | `http://localhost:8080/api/v1/swagger-ui` | Hiển thị tài liệu API |
| AI Service | `http://localhost:8000/health` | `{"status": "ok"}` |
| PostgreSQL | `localhost:5432` | Kết nối thành công (dùng pgAdmin hoặc CLI) |
| Redis | `localhost:6379` | Phản hồi `PONG` khi chạy `redis-cli ping` |
| Elasticsearch | `http://localhost:9200` | Trả về thông tin cluster |
| Qdrant | `http://localhost:6333/dashboard` | Hiển thị dashboard Qdrant |

**(Tùy chọn)** Nạp dữ liệu mẫu để kiểm thử. Chạy lệnh sau để thực thi file seed data:

```bash
cd server
docker compose up seed
```

Lệnh này sẽ khởi tạo Flyway migration (nếu chưa chạy) và nạp dữ liệu mẫu vào cơ sở dữ liệu. Xem chi tiết về tài khoản mẫu tại [Mục 9](#9-tài-khoản-mẫu-và-dữ-liệu-seed).

---

## 8. Triển khai môi trường production (Docker)

Phương pháp này triển khai **toàn bộ** hệ thống (bao gồm cả ứng dụng và hạ tầng) trong Docker container, phù hợp cho môi trường staging hoặc production.

### 8.1. Cấu hình biến môi trường

Tạo file `.env` tại thư mục `infra/docker/`:

```bash
cd infra/docker
cp ../../.env.example .env
```

Chỉnh sửa file `.env` với các giá trị production thực tế. **Bắt buộc** phải đặt các giá trị sau:

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

### 8.2. Khởi động toàn bộ hệ thống

Di chuyển vào thư mục `infra/docker/` và chạy:

```bash
cd infra/docker
docker compose up -d --build
```

Lệnh này sẽ thực hiện các bước sau theo thứ tự:

1. **Build** Docker image cho Backend, AI Service và Frontend
2. **Khởi động** PostgreSQL, Redis, Elasticsearch, Qdrant
3. **Chạy** Flyway migration để tạo schema cơ sở dữ liệu
4. **Nạp** dữ liệu seed (nếu được cấu hình)
5. **Khởi động** Backend Spring Boot API
6. **Khởi động** AI Service (FastAPI)
7. **Khởi động** Frontend (phục vụ bằng `serve`)
8. **Khởi động** Nginx reverse proxy

Toàn bộ quá trình có thể mất **5–10 phút** ở lần đầu tiên.

Sau khi hoàn tất, toàn bộ hệ thống có thể truy cập qua **một cổng duy nhất**:

```
http://localhost
```

Nginx sẽ tự động định tuyến các request:

| Đường dẫn | Dịch vụ đích |
|---|---|
| `/` | Frontend (React) |
| `/api/core/v1/*` | Backend API (Spring Boot) |
| `/api/chat/v1/*` | AI Service (FastAPI) |

### 8.3. Kiểm tra trạng thái các dịch vụ

```bash
docker compose ps
```

Kết quả mong đợi — tất cả các dịch vụ ở trạng thái `Up` hoặc `healthy`:

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

> **Lưu ý:** `tasksense_flyway` và `tasksense_seed` ở trạng thái `Exited (0)` là bình thường — chúng là các container chạy một lần (one-shot) để khởi tạo cơ sở dữ liệu.

Xem log của một dịch vụ cụ thể:

```bash
docker compose logs -f tasksense-spring-api
docker compose logs -f tasksense-ai
docker compose logs -f tasksense-client
```

Dừng toàn bộ hệ thống:

```bash
docker compose down
```

Dừng và **xóa toàn bộ dữ liệu** (volumes):

```bash
docker compose down -v
```

---

## 9. Tài khoản mẫu và dữ liệu seed

Hệ thống đi kèm file dữ liệu mẫu (`seed_data.sql`) để phục vụ kiểm thử. Sau khi nạp dữ liệu seed, các tài khoản sau sẵn sàng sử dụng:

| Email | Mật khẩu | Tên đầy đủ | Vai trò |
|---|---|---|---|
| `alice@example.com` | `password` | Alice Nguyen | Full-stack developer & tech lead |
| `bob@example.com` | `password` | Bob Tran | Project manager |
| `carol@example.com` | `password` | Carol Le | Frontend developer |
| `dave@example.com` | `password` | Dave Pham | Backend developer |
| `eve@example.com` | `password` | Eve Hoang | QA engineer |

> **Cảnh báo:** Tuyệt đối **không** sử dụng dữ liệu seed và các mật khẩu mặc định trên môi trường production thực tế.

---

## 10. Xử lý sự cố thường gặp

### 10.1. Lỗi Elasticsearch không khởi động

**Triệu chứng:** Container `tasksense_es` liên tục restart hoặc thoát với lỗi.

**Nguyên nhân:** Elasticsearch yêu cầu giá trị `vm.max_map_count` tối thiểu là 262144.

**Giải pháp:**

- Trên **Linux/WSL2**:

```bash
sudo sysctl -w vm.max_map_count=262144
```

Để áp dụng vĩnh viễn, thêm dòng sau vào `/etc/sysctl.conf`:

```
vm.max_map_count=262144
```

- Trên **Windows** (chạy trong WSL2 terminal):

```bash
wsl -d docker-desktop -u root
sysctl -w vm.max_map_count=262144
```

- Trên **macOS** (Docker Desktop): Thường không cần thay đổi, Docker Desktop tự xử lý.

### 10.2. Lỗi cổng đã được sử dụng (Port already in use)

**Triệu chứng:** Thông báo lỗi "port is already allocated" hoặc "address already in use".

**Giải pháp:**

- Kiểm tra tiến trình đang sử dụng cổng:

  - Trên **Windows**:

  ```powershell
  netstat -ano | findstr :<PORT>
  taskkill /PID <PID> /F
  ```

  - Trên **macOS/Linux**:

  ```bash
  lsof -i :<PORT>
  kill -9 <PID>
  ```

- Hoặc thay đổi cổng trong file cấu hình tương ứng.

### 10.3. Lỗi kết nối cơ sở dữ liệu từ Backend

**Triệu chứng:** Backend log hiển thị `Connection refused` tới PostgreSQL.

**Giải pháp:**

1. Đảm bảo container PostgreSQL đang chạy: `docker compose ps`
2. Kiểm tra PostgreSQL đã sẵn sàng: `docker exec task_postgres pg_isready -U postgres`
3. Đảm bảo cổng 5432 không bị tường lửa chặn

### 10.4. Frontend không kết nối được Backend

**Triệu chứng:** Giao diện hiển thị lỗi mạng (Network Error) khi gọi API.

**Giải pháp:**

1. Kiểm tra file `client/.env` có đúng giá trị `VITE_API_BASE_URL`
2. Đảm bảo Backend đang chạy tại cổng đã cấu hình
3. Kiểm tra trình duyệt không bị chặn bởi chính sách CORS
4. Khởi động lại Frontend sau khi thay đổi file `.env`:

```bash
# Dừng dev server (Ctrl+C) rồi chạy lại
npm run dev
```

### 10.5. Dịch vụ AI không phản hồi

**Triệu chứng:** API chatbot trả về lỗi 500 hoặc timeout.

**Giải pháp:**

1. Kiểm tra API key của nhà cung cấp LLM đã được cấu hình đúng
2. Kiểm tra Qdrant đang chạy: `http://localhost:6333/dashboard`
3. Xem log chi tiết của dịch vụ AI:

```bash
# Nếu chạy development
# Kiểm tra terminal đang chạy uvicorn

# Nếu chạy Docker
docker compose logs -f tasksense-ai
```

### 10.6. Lỗi Docker build thất bại

**Triệu chứng:** `docker compose up --build` thất bại với lỗi build.

**Giải pháp:**

1. Xóa cache Docker và build lại:

```bash
docker compose build --no-cache
docker compose up -d
```

2. Đảm bảo đủ dung lượng ổ cứng (Docker image có thể chiếm đến vài GB)
3. Kiểm tra kết nối Internet ổn định (cần tải base image và dependencies)

### 10.7. Lỗi "SECURITY_JWT_SECRET is required"

**Triệu chứng:** Docker compose không thể khởi động, hiển thị lỗi biến bắt buộc.

**Giải pháp:** Đảm bảo file `.env` đã được tạo đúng vị trí và chứa giá trị `SECURITY_JWT_SECRET`. Với triển khai production, file `.env` phải nằm trong thư mục `infra/docker/`.
