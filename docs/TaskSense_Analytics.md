# TaskSense — Tài liệu Phân tích (Analytics)

## 1. Tổng quan kiến trúc

Hệ thống analytics của TaskSense được xây dựng hoàn toàn trên **Elasticsearch aggregations**, không tính toán trên Postgres hay frontend.

```
Client (React)
  └─ GET /projects/{id}/analytics
       └─ AnalyticsController
            └─ SearchIndexService.getProjectAnalytics()
                 └─ NativeQuery → ES index "tasks"
                      └─ 7 aggregations song song
                           └─ Java tính toán derived metrics
                                └─ ProjectAnalyticsResponse (JSON)
```

### Luồng dữ liệu vào ES

Dữ liệu trong index `tasks` luôn đồng bộ với Postgres qua hai cơ chế:

| Cơ chế | Trigger | Mục đích |
|---|---|---|
| `EntityChangedEventListener` | Sau mỗi transaction commit | Realtime sync (low latency) |
| `SyncEsWorker` | Cron 14:11 hàng ngày | Safety net — catch những record bị bỏ sót |

Vì mỗi `save()` là **upsert theo document ID**, không bao giờ có dữ liệu trùng → kết quả aggregation chính xác.

---

## 2. Phân quyền

| Role | Quyền xem |
|---|---|
| MANAGER | Toàn bộ — bao gồm **Member Performance** |
| MEMBER / VIEWER | Tất cả trừ Member Performance |

Permission check ở backend: `@PreAuthorize("@perm.project(#projectId, 'VIEW_TASKS')")`.
Permission check ở frontend: `showMemberWorkload = canManageMembers` (tính từ project permissions).

---

## 3. Các chỉ số và cách tính

### 3.1 Total Tasks

- **Giá trị**: Tổng số task thuộc project
- **ES query**: `term(projectId)` → `hits.total`
- **Dùng để**: Phân mẫu số cho tất cả các tỷ lệ %

---

### 3.2 Status Distribution

- **Giá trị**: Số task theo từng trạng thái: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`
- **ES aggregation**: `terms` trên field `status` (keyword)
- **Kết quả**: `Map<status, count>`

```
status_dist:
  terms(field="status", size=10)
```

---

### 3.3 Priority Distribution

- **Giá trị**: Số task theo từng mức ưu tiên: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **ES aggregation**: `terms` trên field `priority` (keyword)
- **Kết quả**: `Map<priority, count>`

```
priority_dist:
  terms(field="priority", size=10)
```

---

### 3.4 Overdue Count

- **Giá trị**: Số task quá hạn mà chưa hoàn thành
- **Điều kiện**: `dueDate < now` **AND** `status != DONE`
- **ES aggregation**: `filter` (bool query)
- **Kết quả**: `docCount` của filter bucket

```
overdue:
  filter(
    bool:
      must: range(dueDate < now)
      must_not: term(status = DONE)
  )
```

---

### 3.5 Completion Trend (30 ngày)

- **Giá trị**: Số task hoàn thành mỗi ngày trong 30 ngày gần nhất
- **ES aggregation**: `filter` (completedAt >= 30d ago) → `date_histogram` theo ngày
- **Kết quả**: `List<{date: "yyyy-MM-dd", count}>`
- **Dùng để**: Line chart xu hướng + tính `avgDailyVelocity`

```
completion_trend:
  filter(range: completedAt >= now-30d)
    by_day: date_histogram(field="completedAt", interval=day, format="yyyy-MM-dd")
```

---

### 3.6 Health Score

- **Giá trị**: Điểm sức khoẻ tổng thể của project, thang 0–100
- **Công thức**:

```
completionRate = doneCount / totalTasks × 100
onTimeRate     = (1 - overdueCount / totalTasks) × 100
healthScore    = round(completionRate × 0.6 + onTimeRate × 0.4)
```

- **Phân loại**:
  - `75–100` → **Healthy** (xanh lá)
  - `50–74`  → **At Risk** (vàng)
  - `0–49`   → **Critical** (đỏ)

- **Không cần ES query riêng** — tính từ `statusDistribution["DONE"]` và `overdueCount` đã có.

---

### 3.7 Projected Completion Date

- **Giá trị**: Ngày dự kiến hoàn thành toàn bộ task, dựa trên velocity hiện tại
- **Công thức**:

```
avgDailyVelocity = sum(completionTrend) / 30        # task/ngày
remaining        = totalTasks - doneCount
daysNeeded       = ceil(remaining / avgDailyVelocity)
projectedDate    = today + daysNeeded
```

- **Trường hợp đặc biệt**:
  - `remaining = 0` → trả về `today` (đã xong)
  - `avgDailyVelocity = 0` → trả về `null` (không đủ dữ liệu để dự đoán)

- **Không cần ES query riêng** — tính từ `completionTrend` đã có.

---

### 3.8 Sprint Velocity

- **Giá trị**: Số task `DONE` trong từng sprint
- **ES aggregation**: `filter` (DONE + sprintId exists) → `terms` trên `sprintId`
- **Kết quả**: `List<{sprintId, completedCount}>`
- **Frontend**: Join với sprint list để lấy tên sprint → Bar chart

```
sprint_velocity:
  filter(
    bool:
      must: term(status = DONE)
      must: exists(sprintId)
  )
    by_sprint: terms(field="sprintId", size=20)
```

---

### 3.9 Member Performance

Mỗi thành viên có 4 chỉ số: `assignedCount`, `completedCount`, `overdueCount`, `performanceScore`.

#### Cách thu thập — 3 aggregations ES:

**member_total** — tổng task đang assigned:
```
member_total:
  nested(path="assignees")
    by_user: terms(field="assignees.id", size=100)
```

**member_done** — task đã hoàn thành:
```
member_done:
  filter(status = DONE)
    nested_users: nested(path="assignees")
      by_user: terms(field="assignees.id", size=100)
```

**member_overdue** — task quá hạn:
```
member_overdue:
  filter(dueDate < now AND status != DONE)
    nested_users: nested(path="assignees")
      by_user: terms(field="assignees.id", size=100)
```

> **Lý do dùng `filter` trước `nested`**: Field `status` và `dueDate` nằm ở cấp task (root document), không phải trong nested `assignees`. Phải filter ở root level trước, rồi mới nested vào để đếm assignees của những task thoả điều kiện.

#### Performance Score — công thức:

```
completionRate = completedCount / assignedCount         # 0–1
onTimeRate     = max(0, 1 - overdueCount / assignedCount)  # 0–1
performanceScore = round((completionRate × 0.6 + onTimeRate × 0.4) × 100)
```

- `assignedCount = 0` → score = 100 (không có task, không bị phạt)
- Thang điểm và màu sắc giống Health Score (75+ xanh, 50–74 vàng, <50 đỏ)

---

## 4. Giới hạn và điểm cần lưu ý

| Điểm | Giải thích |
|---|---|
| **Projected date là ước tính** | Dựa trên tốc độ 30 ngày gần nhất, không tính sprint deadline hay priority của task còn lại |
| **Velocity = 0 nếu không có completion trong 30 ngày** | Project mới hoặc bị đình trệ sẽ không có predicted date |
| **Member performance tính task assigned hiện tại** | Nếu member bị unassign khỏi task cũ, task đó không còn tính vào `assignedCount` của họ |
| **Sprint velocity chỉ tính DONE** | Task ở REVIEW trong sprint không được tính vào velocity của sprint đó |
| **ES cần online** | Nếu ES down, endpoint trả về lỗi 500. Không có fallback sang Postgres. |

---

## 5. Cấu trúc dữ liệu response

```json
{
  "totalTasks": 42,
  "statusDistribution": { "TODO": 10, "IN_PROGRESS": 15, "REVIEW": 5, "DONE": 12 },
  "priorityDistribution": { "LOW": 5, "MEDIUM": 20, "HIGH": 12, "URGENT": 5 },
  "overdueCount": 8,
  "completionTrend": [
    { "date": "2026-03-01", "count": 2 },
    { "date": "2026-03-03", "count": 1 }
  ],
  "healthScore": 51,
  "projectedCompletionDate": "2026-04-15",
  "avgDailyVelocity": 1.0,
  "sprintVelocity": [
    { "sprintId": 1, "completedCount": 8 },
    { "sprintId": 2, "completedCount": 4 }
  ],
  "memberPerformance": [
    {
      "userId": 5,
      "assignedCount": 10,
      "completedCount": 7,
      "overdueCount": 1,
      "performanceScore": 78
    }
  ]
}
```

---

## 6. Mở rộng trong tương lai (nếu cần)

| Feature | Cách thực hiện |
|---|---|
| Cycle time trung bình (IN_PROGRESS → DONE) | Lưu thêm field `inProgressAt` vào TaskDocument, dùng `avg` aggregation trên `(completedAt - inProgressAt)` |
| Burndown chart | Cần snapshot task count theo ngày — ES không hỗ trợ native, cần lưu daily snapshot riêng |
| ML-based prediction | Export data từ ES → Python (scikit-learn / statsmodels) để train time-series model |
| Anomaly detection | Dùng ES X-Pack ML (cần Elastic license) để phát hiện velocity bất thường |
