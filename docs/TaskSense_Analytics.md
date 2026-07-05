# TaskSense — Document Analysis (Analytics)

## 1. Architecture overview

TaskSense's analytics system is built entirely on **Elasticsearch aggregations**, not calculated on Postgres or frontend.

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

### Stream data into ES

Data in index `tasks` is always synchronized with Postgres through two mechanisms:

| Mechanism | Triggers | Purpose |
|---|---|---|
| `EntityChangedEventListener` | After each transaction commit | Realtime sync (low latency) |
| `SyncEsWorker` | Cron 14:11 daily | Safety net — catch missed records |

Because each `save()` is **upsert according to document ID**, there is never duplicate data → accurate aggregation results.

---

## 2. Decentralization

| Role | Viewing rights |
|---|---|
| MANAGER | Complete — including **Member Performance** |
| MEMBER / VIEWER | All but Member Performance |

Permission check on the backend: `@PreAuthorize("@perm.project(#projectId, 'VIEW_TASKS')")`.
Permission check in frontend: `showMemberWorkload = canManageMembers` (counts from project permissions).

---

## 3. Indicators and calculations

### 3.1 Total Tasks

- **Value**: Total number of tasks in the project
- **ES query**: `term(projectId)` → `hits.total`
- **Used for**: Divide denominators for all percentages

---

### 3.2 Status Distribution

- **Value**: Number of tasks by each status: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`
- **ES aggregation**: `terms` on field `status` (keyword)
- **Result**: `Map<status, count>`

```
status_dist:
  terms(field="status", size=10)
```

---

### 3.3 Priority Distribution

- **Value**: Number of tasks according to each priority level: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **ES aggregation**: `terms` on field `priority` (keyword)
- **Result**: `Map<priority, count>`

```
priority_dist:
  terms(field="priority", size=10)
```

---

### 3.4 Overdue Count

- **Value**: Number of overdue tasks that have not been completed
- **Conditions**: `dueDate < now` **AND** `status != DONE`
- **ES aggregation**: `filter` (bool query)
- **Result**: `docCount` of filter bucket

```
overdue:
  filter(
    bool:
      must: range(dueDate < now)
      must_not: term(status = DONE)
  )
```

---

### 3.5 Completion Trend (30 days)

- **Value**: Number of tasks completed per day in the last 30 days
- **ES aggregation**: `filter` (completedAt >= 30d ago) → `date_histogram` by date
- **Result**: `List<{date: "yyyy-MM-dd", count}>`
- **Used for**: Line chart trend + calculate `avgDailyVelocity`

```
completion_trend:
  filter(range: completedAt >= now-30d)
    by_day: date_histogram(field="completedAt", interval=day, format="yyyy-MM-dd")
```

---

### 3.6 Health Score

- **Value**: Overall project health score, scale 0–100
- **Formula**:

```
completionRate = doneCount / totalTasks × 100
onTimeRate     = (1 - overdueCount / totalTasks) × 100
healthScore    = round(completionRate × 0.6 + onTimeRate × 0.4)
```

- **Classification**:
  - `75–100` → **Healthy** (green)
  - `50–74` → **At Risk** (gold)
  - `0–49` → **Critical** (red)

- **No need for separate ES query** — `statusDistribution["DONE"]` and `overdueCount` already exist.

---

### 3.7 Projected Completion Date

- **Value**: Expected date to complete the entire task, based on current velocity
- **Formula**:

```
avgDailyVelocity = sum(completionTrend) / 30        # task/ngày
remaining        = totalTasks - doneCount
daysNeeded       = ceil(remaining / avgDailyVelocity)
projectedDate    = today + daysNeeded
```

- **Special cases**:
  - `remaining = 0` → returns `today` (done)
  - `avgDailyVelocity = 0` → returns `null` (not enough data to predict)

- **No need for separate ES query** — `completionTrend` adjective already exists.

---

### 3.8 Sprint Velocity

- **Value**: Number of tasks `DONE` in each sprint
- **ES aggregation**: `filter` (DONE + sprintId exists) → `terms` on `sprintId`
- **Result**: `List<{sprintId, completedCount}>`
- **Frontend**: Join with sprint list to get sprint name → Bar chart

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

Each member has 4 indexes: `assignedCount`, `completedCount`, `overdueCount`, `performanceScore`.

#### How to collect — 3 ES aggregations:

**member_total** — total assigned tasks:
```
member_total:
  nested(path="assignees")
    by_user: terms(field="assignees.id", size=100)
```

**member_done** — task completed:
```
member_done:
  filter(status = DONE)
    nested_users: nested(path="assignees")
      by_user: terms(field="assignees.id", size=100)
```

**member_overdue** — task is overdue:
```
member_overdue:
  filter(dueDate < now AND status != DONE)
    nested_users: nested(path="assignees")
      by_user: terms(field="assignees.id", size=100)
```

> **Reason for using `filter` before `nested`**: Fields `status` and `dueDate` are at the task level (root document), not in nested `assignees`. Must filter at the root level first, then nested to count assignees of tasks that meet the conditions.

#### Performance Score — formula:

```
completionRate = completedCount / assignedCount         # 0–1
onTimeRate     = max(0, 1 - overdueCount / assignedCount)  # 0–1
performanceScore = round((completionRate × 0.6 + onTimeRate × 0.4) × 100)
```

- `assignedCount = 0` → score = 100 (no task, no penalty)
- Scale and color are similar to Health Score (75+ green, 50–74 yellow, <50 red)

---

## 4. Limitations and points to note

| Score | Explanation |
|---|---|
| **Projected date is an estimate** | Based on the latest 30-day speed, not counting the sprint deadline or priority of the remaining tasks |
| **Velocity = 0 if there is no completion within 30 days** | New or stalled projects will not have a predicted date |
| **Member performance calculates current assigned tasks** | If a member is unassigned from an old task, that task will no longer count towards their `assignedCount` |
| **Sprint velocity only counts DONE** | Tasks in REVIEW during a sprint are not included in the velocity of that sprint
| **ES needs to be online** | If ES is down, the endpoint returns error 500. There is no fallback to Postgres. |

---

## 5. Response data structure

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

## 6. Future expansion (if needed)

| Features | How to do |
|---|---|
| Average cycle time (IN_PROGRESS → DONE) | Save additional field `inProgressAt` to TaskDocument, use `avg` aggregation on `(completedAt - inProgressAt)` |
| Burndown chart | Need snapshot task count by day — ES does not support native, need to save daily snapshot separately |
| ML-based prediction | Export data from ES → Python (scikit-learn / statsmodels) to train time-series model |
| Anomaly detection | Use ES X-Pack ML (requires Elastic license) to detect abnormal velocity |