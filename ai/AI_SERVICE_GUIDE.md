# TaskSense AI Service — Hướng dẫn toàn diện

> **Dành cho:** Lập trình viên chưa có kinh nghiệm AI
> **Mục tiêu:** Hiểu hệ thống này làm gì, từng phần hoạt động ra sao, và tại sao lại xây dựng như vậy

---

## Mục lục

1. [Tổng quan — hệ thống này làm gì?](#1-tổng-quan)
2. [Khái niệm cốt lõi: RAG là gì?](#2-khái-niệm-cốt-lõi-rag-là-gì)
3. [Tech Stack — những công nghệ được dùng](#3-tech-stack)
4. [Kiến trúc thư mục](#4-kiến-trúc-thư-mục)
5. [Luồng xử lý chính — từ câu hỏi đến câu trả lời](#5-luồng-xử-lý-chính)
6. [Chi tiết từng component](#6-chi-tiết-từng-component)
7. [Luồng đồng bộ dữ liệu (Indexer)](#7-luồng-đồng-bộ-dữ-liệu-indexer)
8. [Lớp API và Authentication](#8-lớp-api-và-authentication)
9. [Cấu hình (Config)](#9-cấu-hình-config)
10. [Sơ đồ tổng thể](#10-sơ-đồ-tổng-thể)

---

## 1. Tổng quan

TaskSense AI Service là một **chatbot thông minh** cho phép người dùng hỏi về task và project bằng ngôn ngữ tự nhiên.

**Ví dụ câu hỏi người dùng có thể hỏi:**
- _"Task nào đang quá hạn trong project Alpha?"_
- _"Tôi có bao nhiêu task đang IN_PROGRESS?"_
- _"Dự án Beta hiện có bao nhiêu thành viên?"_

**Hệ thống KHÔNG làm gì:**
- Không trả lời câu hỏi ngoài lề (thời tiết, toán học, v.v.)
- Không bịa thông tin — chỉ trả lời dựa trên dữ liệu thực trong database

---

## 2. Khái niệm cốt lõi: RAG là gì?

### RAG = Retrieval-Augmented Generation

Đây là kỹ thuật kết hợp **tìm kiếm dữ liệu** với **sinh văn bản bằng AI**.

**Vấn đề của AI thông thường (ChatGPT thuần):**
> AI được train đến một ngày nhất định, không biết dữ liệu riêng của bạn (task, project, deadline...).

**Giải pháp RAG — 3 bước đơn giản:**

```
Câu hỏi người dùng
      │
      ▼
[1. RETRIEVE] Tìm kiếm tài liệu liên quan từ database
      │
      ▼
[2. AUGMENT]  Ghép tài liệu tìm được vào câu hỏi
      │
      ▼
[3. GENERATE] AI đọc tài liệu đó và sinh câu trả lời
```

**Ví dụ thực tế:**
```
Câu hỏi: "Task nào đang quá hạn?"
    │
    ▼
[Tìm kiếm] → Tìm trong Qdrant: 5 task có dueDate < hôm nay
    │
    ▼
[Ghép vào prompt] → "Dựa vào dữ liệu sau: [Task A - quá hạn 2 ngày]..."
    │
    ▼
[AI trả lời] → "Task A đang quá hạn 2 ngày, hiện chưa có assignee..."
```

---

## 3. Tech Stack

### Ngôn ngữ & Framework

| Công nghệ | Vai trò | Giải thích đơn giản |
|-----------|---------|---------------------|
| **Python 3.13** | Ngôn ngữ chính | Phổ biến nhất cho AI/ML |
| **FastAPI** | Web framework | Tạo các HTTP API endpoint, tự động sinh docs tại `/docs` |
| **Uvicorn** | ASGI server | Chạy FastAPI, giống như Tomcat cho Java |
| **Pydantic** | Validation | Kiểm tra kiểu dữ liệu cho request/response |
| **uv** | Package manager | Quản lý dependencies, thay thế pip (nhanh hơn) |

### AI / LLM

| Công nghệ | Vai trò | Giải thích đơn giản |
|-----------|---------|---------------------|
| **LangChain** | AI orchestration framework | "Keo dán" nối các phần AI lại với nhau |
| **LangChain Core** | Base classes | Định nghĩa interface chung cho LLM, Embeddings... |
| **langchain-openai** | OpenAI integration | Dùng GPT-4o-mini qua API |
| **langchain-google-genai** | Google integration | Dùng Gemini 2.5 Flash (mặc định) |
| **langchain-openrouter** | OpenRouter integration | Proxy nhiều LLM qua một API |
| **openai** | OpenAI SDK | Client gốc của OpenAI |

> **LLM** (Large Language Model) = mô hình AI ngôn ngữ lớn như GPT, Gemini. Chúng "hiểu" và "sinh" văn bản.

### Vector Database

| Công nghệ | Vai trò | Giải thích đơn giản |
|-----------|---------|---------------------|
| **Qdrant** | Vector database | Database đặc biệt lưu trữ và tìm kiếm theo "vector" |
| **qdrant-client** | Python client | Thư viện Python để giao tiếp với Qdrant |
| **langchain-qdrant** | LangChain integration | Wrapper của qdrant-client cho LangChain |

> **Vector** = một mảng số thực (ví dụ: `[0.12, -0.45, 0.87, ...]`) đại diện cho "ý nghĩa" của một đoạn văn bản. Hai đoạn văn có nghĩa gần nhau sẽ có vector gần nhau trong không gian toán học.
>
> **Embedding** = quá trình chuyển văn bản thành vector. Ví dụ: "task bị trễ" và "deadline quá hạn" → hai vector rất gần nhau.

### Database & Persistence

| Công nghệ | Vai trò | Giải thích đơn giản |
|-----------|---------|---------------------|
| **PostgreSQL** | Relational database | Lưu task, project, user, chat history |
| **psycopg3** | PostgreSQL client | Thư viện Python để query PostgreSQL |
| **APScheduler** | Task scheduler | Chạy công việc định kỳ (sync data mỗi 60 phút) |

### Authentication

| Công nghệ | Vai trò | Giải thích đơn giản |
|-----------|---------|---------------------|
| **PyJWT** | JWT library | Đọc và xác thực JWT token |

---

## 4. Kiến trúc thư mục

```
ai/
├── app/                          # Toàn bộ source code
│   ├── main.py                   # Entry point — khởi động server
│   ├── config/
│   │   └── config.py             # Đọc biến môi trường (.env)
│   │
│   ├── auth/                     # Xác thực
│   │   ├── middleware.py         # JWT middleware (chặn request không có token)
│   │   └── dependencies.py       # FastAPI Depends để lấy user_id
│   │
│   ├── controller/v1/            # API endpoints (HTTP layer)
│   │   ├── chatbot_controller.py # POST /ai/chat/{session_id}
│   │   └── session_controller.py # CRUD cho chat sessions
│   │
│   ├── service/                  # Business logic layer
│   │   ├── chatbot_service.py    # Điều phối toàn bộ RAG pipeline
│   │   ├── embedding_service.py  # Đồng bộ PostgreSQL → Qdrant
│   │   ├── session_service.py    # Quản lý chat sessions
│   │   ├── chat_persistence_service.py  # Lưu lịch sử chat
│   │   └── source_truth_service.py     # Query PostgreSQL lấy dữ liệu thật
│   │
│   ├── chatbot/                  # Core AI components
│   │   ├── components/
│   │   │   ├── classifier.py     # Phân loại câu hỏi (liên quan hay không?)
│   │   │   ├── rewriter.py       # Viết lại câu hỏi thành search queries
│   │   │   ├── retriever.py      # Tìm kiếm trong Qdrant
│   │   │   ├── filter.py         # Lọc và dedup kết quả
│   │   │   ├── generator.py      # Sinh câu trả lời từ AI
│   │   │   └── validator.py      # Kiểm tra câu trả lời có chính xác không
│   │   ├── prompts/
│   │   │   ├── classifier.txt    # System prompt cho classifier
│   │   │   ├── rewrite.txt       # System prompt cho rewriter
│   │   │   ├── answer.txt        # System prompt cho generator
│   │   │   └── validate.txt      # System prompt cho validator
│   │   └── pipeline.py           # Facade (wrapper đơn giản)
│   │
│   ├── client/                   # External service clients
│   │   ├── llms.py               # Factory tạo LLM instance
│   │   ├── embedding.py          # Factory tạo Embedding instance
│   │   └── qdrant_client.py      # Factory tạo Qdrant client
│   │
│   ├── indexer/                  # Sync scheduler
│   │   ├── scheduler.py          # APScheduler setup
│   │   └── sync.py               # Trigger embedding sync
│   │
│   └── core/
│       └── response.py           # ResponseObject wrapper chuẩn
│
├── tests/
│   ├── test_classifier.py
│   └── test_retriever.py
│
└── pyproject.toml                # Project metadata + dependencies
```

### Tại sao chia nhiều lớp như vậy?

```
HTTP Request
     │
     ▼
[Controller]    ← Chỉ nhận/trả HTTP, không chứa logic
     │
     ▼
[Service]       ← Chứa business logic, điều phối các bước
     │
     ▼
[Components]    ← Từng bước nhỏ trong pipeline AI
     │
     ▼
[Client]        ← Giao tiếp với Qdrant, LLM, PostgreSQL
```

Pattern này gọi là **Layered Architecture** — giúp dễ test từng phần riêng lẻ.

---

## 5. Luồng xử lý chính

Khi người dùng gửi câu hỏi, hệ thống đi qua **6 bước** sau:

```
User gửi: "Task nào đang quá hạn trong project Alpha?"
│
├─ [Bước 1: CLASSIFY] ─────────────────────────────────────────────
│   Câu hỏi này có liên quan đến task/project không?
│   → is_relevant: true, intent: "task_query", is_personal: false
│
├─ [Bước 2: REWRITE] ──────────────────────────────────────────────
│   Viết lại thành 2-3 search query cụ thể bằng tiếng Anh
│   → ["overdue tasks project Alpha", "past deadline Alpha tasks",
│      "task status overdue Alpha project"]
│
├─ [Bước 3: RETRIEVE] ─────────────────────────────────────────────
│   Với mỗi query trên, tìm top-5 document giống nhất trong Qdrant
│   → [Task A (score: 0.92), Task B (score: 0.87), Task C (score: 0.81)...]
│
├─ [Bước 4: FILTER] ───────────────────────────────────────────────
│   Dedup (xóa trùng lặp), giữ top-3 document có score cao nhất
│   → [Task A, Task B, Task C]
│
├─ [Bước 5: HYDRATE] ──────────────────────────────────────────────
│   Lấy dữ liệu mới nhất từ PostgreSQL (Qdrant có thể lỗi thời)
│   → [Task A fresh data, Task B fresh data, Task C fresh data]
│
└─ [Bước 6: GENERATE] ─────────────────────────────────────────────
    Đưa câu hỏi + dữ liệu vào LLM, AI sinh câu trả lời
    → "Trong project Alpha, có 3 task đang quá hạn: Task A (quá 2 ngày)..."
```

### Trường hợp đặc biệt: Count Query

Nếu người dùng hỏi "_Tôi có bao nhiêu task?_" (`intent: "count_query"`), thay vì dùng Qdrant, hệ thống query thẳng PostgreSQL để đếm chính xác.

### Trường hợp không liên quan

Nếu câu hỏi không liên quan đến task/project (ví dụ: "_Thủ đô nước Pháp là gì?_"), hệ thống trả về ngay mà không chạy RAG.

---

## 6. Chi tiết từng component

### 6.1 Classifier (`app/chatbot/components/classifier.py`)

**Nhiệm vụ:** Xác định câu hỏi có liên quan đến TaskSense không, và nếu có thì loại intent nào.

**Cách hoạt động:**
1. Đọc system prompt từ `prompts/classifier.txt`
2. Gửi câu hỏi cho LLM
3. LLM trả về JSON theo schema cố định:

```json
{
  "is_relevant": true,
  "intent": "task_query",
  "is_personal": false
}
```

**Các giá trị của `intent`:**

| Intent | Ý nghĩa | Ví dụ |
|--------|---------|-------|
| `task_query` | Hỏi về task cụ thể | "Task nào đang IN_PROGRESS?" |
| `project_query` | Hỏi về project/workspace | "Project Alpha có bao nhiêu thành viên?" |
| `count_query` | Hỏi số lượng | "Tôi có bao nhiêu task?" |
| `unrelated` | Không liên quan | "Hôm nay thời tiết thế nào?" |

**`is_personal`:** `true` chỉ khi người dùng nói "của tôi", "tôi", "mine", "my tasks"...

---

### 6.2 Rewriter (`app/chatbot/components/rewriter.py`)

**Nhiệm vụ:** Biến câu hỏi tự nhiên của người dùng thành 2-3 search query ngắn gọn, tiếng Anh.

**Tại sao cần bước này?**

Câu hỏi người dùng thường dài, mang ngữ cảnh, không phù hợp để tìm kiếm vector. Rewriter "cô đọng" lại thành các cụm từ từ khóa.

**Ví dụ:**
```
Input:  "Những task nào trong workspace của tôi bị trễ deadline và chưa có ai nhận?"
Output: [
  "overdue tasks no assignee deadline missed",
  "unassigned tasks past due date",
  "tasks deadline exceeded without assignee"
]
```

**Tại sao ra tiếng Anh?** Vì embedding model (chuyển text → vector) hoạt động tốt hơn với tiếng Anh, và data trong Qdrant cũng được index bằng tiếng Anh.

---

### 6.3 Retriever (`app/chatbot/components/retriever.py`)

**Nhiệm vụ:** Dùng Qdrant để tìm các task/project liên quan nhất đến search query.

**Khái niệm quan trọng: Vector Similarity Search**

```
Query: "overdue tasks no assignee"
    │
    ▼
[Embedding model] → chuyển thành vector: [0.12, -0.45, 0.87, ...]
    │
    ▼
[Qdrant] → tìm top-5 vector gần nhất trong database
    │       (dùng Cosine Similarity — góc giữa 2 vector)
    ▼
[Kết quả] → 5 task có nội dung ngữ nghĩa gần với query nhất
```

**Scope filtering — lọc theo quyền:**

| Điều kiện | Filter được áp dụng |
|-----------|---------------------|
| `is_personal=true` | Chỉ task của user (createdById hoặc assignees) |
| `project_id` có giá trị | Chỉ task trong project đó |
| `workspace_id` có giá trị | Chỉ task trong workspace đó |
| Không có gì | Tìm tất cả (không lọc) |

**Lưu ý:** Retriever tìm trong 2 collection của Qdrant:
- `tasks` — chứa tất cả task
- `projects` — chứa tất cả project

---

### 6.4 Filter (`app/chatbot/components/filter.py`)

**Nhiệm vụ:** Làm sạch kết quả trả về từ Retriever.

**Vấn đề:** Vì Rewriter tạo ra 2-3 query, và mỗi query tìm được 5 documents → tổng cộng có thể lên đến 15 documents, trong đó nhiều cái trùng nhau.

**Giải pháp:**
1. **Deduplication** — xóa trùng lặp theo `(index, id)`, giữ lại bản có `score` cao nhất
2. **Top-K** — chỉ giữ lại top 3 documents

```python
# Pseudocode đơn giản
best = {}
for doc in all_docs:
    key = (doc.index, doc.id)
    if key not in best or doc.score > best[key].score:
        best[key] = doc

top_3 = sorted(best.values(), by=score, descending=True)[:3]
```

---

### 6.5 Generator (`app/chatbot/components/generator.py`)

**Nhiệm vụ:** Đây là trái tim của RAG — kết hợp dữ liệu tìm được với câu hỏi, đưa cho AI sinh câu trả lời.

**Cách hoạt động:**

```
System Prompt (answer.txt) + {context} + {conversation_history}
    │
    ├── {context} được điền bằng dữ liệu task/project đã tìm được:
    │   ┌─────────────────────────────────────────────┐
    │   │ [Task] Làm báo cáo tháng 4                  │
    │   │   Workspace: Engineering                     │
    │   │   Project  : Q2 Planning                    │
    │   │   Status   : IN_PROGRESS                    │
    │   │   Priority : HIGH                           │
    │   │   Due date : 2026-04-15                     │
    │   └─────────────────────────────────────────────┘
    │
    └── {conversation_history} được điền bằng các tin nhắn trước:
        "User: Task nào đang overdue?
         Assistant: Có 2 task đang quá hạn..."

Human Message: câu hỏi gốc của user
    │
    ▼
LLM xử lý → sinh câu trả lời dựa HOÀN TOÀN vào context
```

**Budget giới hạn:** Tổng context tối đa 6000 ký tự (~1500 tokens) để không vượt giới hạn của LLM.

**Fallback:** Nếu không có document nào, trả về message hướng dẫn người dùng hỏi thêm chi tiết.

---

### 6.6 Validator (`app/chatbot/components/validator.py`)

**Nhiệm vụ:** Kiểm tra xem câu trả lời AI sinh ra có được "grounded" (dựa trên dữ liệu thực) không.

**Grounded** = mọi thông tin trong câu trả lời đều có thể truy nguyên về context documents.

**Cách hoạt động:**
1. Nếu câu trả lời là một fallback phrase đã biết → tự động pass (không cần gọi LLM)
2. Nếu không có documents → reject ngay
3. Ngược lại → gọi LLM để fact-check:

```
System: "Mọi claim trong câu trả lời có xuất hiện trong context không?"
Human:  "Answer: [câu trả lời]\nContext: [dữ liệu gốc]"
LLM →  {"is_grounded": true/false}
```

> **Lưu ý:** Validator hiện không được gọi trong pipeline chính (`chatbot_service.py`). Nó đã được implement nhưng chưa được kích hoạt — có thể dùng để tăng chất lượng sau này.

---

## 7. Luồng đồng bộ dữ liệu (Indexer)

### Vấn đề cần giải quyết

Qdrant là database tìm kiếm vector — nhưng dữ liệu gốc (task, project) nằm trong **PostgreSQL**. Làm sao Qdrant biết được?

### Giải pháp: Embedding Sync

```
PostgreSQL (nguồn thật)
        │
        ▼
[embedding_service.py]
        │
        ├── Đọc từng batch (50 records) từ PostgreSQL
        │
        ├── Chuyển thành text mô tả:
        │   "Title: Fix bug #123
        │    Status: IN_PROGRESS
        │    Assignees: John, Jane
        │    Project: Q2 2026
        │    Workspace: Engineering
        │    Relationship: task belongs to project Q2 in workspace Engineering"
        │
        ├── Gọi Embedding API → chuyển text thành vector
        │
        └── Upsert vào Qdrant (thêm mới hoặc cập nhật nếu đã tồn tại)
```

### Scheduler — tự động chạy định kỳ

```
Server khởi động
      │
      ▼
[APScheduler] bắt đầu chạy
      │
      ├── Ngay lập tức: chạy sync lần đầu tiên
      │
      └── Cứ mỗi 60 phút: chạy sync lại
              (đọc từ SYNC_INTERVAL_MINUTES trong .env)
```

**APScheduler** là thư viện Python cho phép lên lịch các công việc định kỳ chạy ngầm trong background thread — không block server.

### Tại sao cần "hydrate" thêm trong pipeline chatbot?

Qdrant chứa bản snapshot dữ liệu tại thời điểm sync cuối cùng. Trong 60 phút giữa 2 lần sync, dữ liệu trong PostgreSQL có thể đã thay đổi (task được cập nhật status, thêm assignee...).

**Hydration** = sau khi tìm được documents từ Qdrant, hệ thống query lại PostgreSQL để lấy dữ liệu mới nhất trước khi đưa cho AI.

---

## 8. Lớp API và Authentication

### Endpoints

Tất cả endpoints đều có prefix `/ai` (khai báo trong `controller/v1/`).

**Chatbot:**

| Method | URL | Mô tả |
|--------|-----|-------|
| `POST` | `/ai/sessions` | Tạo chat session mới |
| `POST` | `/ai/chat/{session_id}` | Gửi câu hỏi, nhận câu trả lời |

**Session Management:**

| Method | URL | Mô tả |
|--------|-----|-------|
| `GET` | `/ai/sessions/` | Danh sách sessions của user |
| `GET` | `/ai/sessions/{id}` | Chi tiết một session |
| `GET` | `/ai/sessions/{id}/messages` | Lịch sử tin nhắn |
| `DELETE` | `/ai/sessions/{id}` | Xóa session |

**Ops:**

| Method | URL | Mô tả |
|--------|-----|-------|
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger UI tự động |

### JWT Authentication — Cách hoạt động

```
Mọi request (trừ /health, /docs) đều phải có:
Header: Authorization: Bearer <jwt_token>

[JwtAuthMiddleware]
    │
    ├── Decode token với secret key
    ├── Kiểm tra type == "ACCESS"
    ├── Trích xuất userId từ claims
    └── Đặt request.state.user_id = userId
              │
              ▼
[Controller] nhận user_id qua Depends(get_current_user_id)
```

**JWT** (JSON Web Token) là chuẩn token xác thực — chứa thông tin user được ký bằng secret key. Không cần query database để biết ai đang đăng nhập.

---

## 9. Cấu hình (Config)

Toàn bộ cấu hình đọc từ file `.env` qua `app/config/config.py`.

### Các nhóm biến môi trường quan trọng

**LLM Provider** — chọn 1 trong 3:
```
LLM_PROVIDER=gemini          # Dùng Gemini (mặc định)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

# Hoặc OpenAI:
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini

# Hoặc OpenRouter (proxy nhiều model):
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=gpt-4o-mini
```

**Qdrant:**
```
QDRANT_HOST=http://localhost:6333
QDRANT_COLLECTION_TASKS=tasks
QDRANT_COLLECTION_PROJECTS=projects
QDRANT_VECTOR_SIZE=3072
```

**PostgreSQL:**
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=taskdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

**Sync:**
```
SYNC_INTERVAL_MINUTES=60   # Sync mỗi 60 phút
SYNC_BATCH_SIZE=50         # Đọc 50 records mỗi batch
```

### Pattern `lru_cache` — tại sao dùng?

```python
@lru_cache(maxsize=1)
def get_settings() -> Settings:
    ...
```

`lru_cache` đảm bảo hàm chỉ chạy **một lần duy nhất** trong suốt vòng đời server. Lần gọi thứ 2 trở đi trả về kết quả đã cache — không đọc file `.env` lại, không khởi tạo LLM client lại.

Tương tự cho `get_llm()`, `get_embedding()`, `_get_client()` (Qdrant) — tất cả đều chỉ tạo một instance và tái sử dụng.

---

## 10. Sơ đồ tổng thể

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                                  │
│     POST /ai/chat/{session_id} {"query": "Task nào overdue?"}       │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ HTTP + JWT Bearer Token
┌──────────────────────▼──────────────────────────────────────────────┐
│                  AI SERVICE (FastAPI + Uvicorn :8000)                │
│                                                                      │
│  [JwtAuthMiddleware] → verify token → attach user_id                │
│                                                                      │
│  [ChatbotController] → validate request → call service              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │              ChatbotService (orchestrator)               │        │
│  │                                                          │        │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐            │        │
│  │  │Classifier│ → │ Rewriter │ → │Retriever │            │        │
│  │  │(LLM call)│   │(LLM call)│   │(Qdrant)  │            │        │
│  │  └──────────┘   └──────────┘   └────┬─────┘            │        │
│  │                                      │                  │        │
│  │                               ┌──────▼─────┐            │        │
│  │                               │   Filter   │            │        │
│  │                               │  (top 3)   │            │        │
│  │                               └──────┬─────┘            │        │
│  │                                      │                  │        │
│  │                               ┌──────▼─────┐            │        │
│  │                               │  Hydrate   │            │        │
│  │                               │(PostgreSQL)│            │        │
│  │                               └──────┬─────┘            │        │
│  │                                      │                  │        │
│  │                               ┌──────▼─────┐            │        │
│  │                               │ Generator  │            │        │
│  │                               │(LLM call)  │            │        │
│  │                               └──────┬─────┘            │        │
│  │                                      │                  │        │
│  │                         [Persist to PostgreSQL]          │        │
│  └──────────────────────────────────────┼──────────────────┘        │
│                                         │                            │
│  [Background: APScheduler]              │                            │
│  PostgreSQL → embed → Qdrant (mỗi 60p) │                            │
└─────────────────────────────────────────┼────────────────────────────┘
                                          │
                              ┌───────────▼──────────┐
                              │   {"answer": "...",  │
                              │    "sources": [...], │
                              │    "sessionId": 42}  │
                              └──────────────────────┘

External Services:
┌────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐
│   Qdrant :6333 │  │  PostgreSQL :5432   │  │  Gemini / OpenAI API │
│  Vector search │  │  Source of truth    │  │  LLM + Embedding     │
└────────────────┘  └─────────────────────┘  └──────────────────────┘
```

---

## Tóm tắt nhanh

| Câu hỏi | Trả lời |
|---------|---------|
| Service này làm gì? | Chatbot hỏi-đáp về task/project dùng kỹ thuật RAG |
| AI model nào được dùng? | Gemini 2.5 Flash (mặc định), có thể đổi sang GPT-4o-mini hoặc OpenRouter |
| Dữ liệu lấy từ đâu? | PostgreSQL (source of truth) → Qdrant (vector search index) |
| Bảo mật như thế nào? | JWT middleware, mọi request phải có valid token |
| Sync dữ liệu khi nào? | Ngay lúc khởi động + mỗi 60 phút (configurable) |
| Framework chính? | FastAPI (Python) — chuẩn REST API, tự sinh Swagger docs |
| Ngôn ngữ hỗ trợ? | Tiếng Việt và tiếng Anh (Rewriter dịch sang EN trước khi search) |
