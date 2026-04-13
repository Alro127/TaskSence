# Project Plan: TaskSense (Aligned Scope)

> Phiên bản này đồng bộ theo quyết định mới: **MVP không AI**, dùng **Elasticsearch cho Search + Analytics cơ bản**, AI chuyển sang **Phase 2**.

## I. Tổng quan

| Danh mục       | Chi tiết                                                |
| :------------- | :------------------------------------------------------ |
| Thời gian      | 15 tuần (27/02/2026 - 29/06/2026)                       |
| Nhân sự        | 2 thành viên fullstack                                  |
| Mô hình        | Workspace-based cho team nhỏ 5-15 người                 |
| Stack chính    | Spring Boot + React + PostgreSQL + Elasticsearch        |
| Triển khai MVP | Local Docker Compose (Postgres + Elasticsearch + MinIO) |

---

## II. Phase Strategy

### Phase 1 (Sprint 1-4) - MVP Delivery

Mục tiêu: đưa sản phẩm chạy được end-to-end cho nhóm nhỏ, có search + dashboard cơ bản.

- Auth + Profile cơ bản
- Workspace + Project + Membership
- Task CRUD + Kanban + fixed workflow status
- Comment + Mention + Notification bell
- File upload (MinIO)
- Elasticsearch Search + Analytics (2 KPI)
- Export PDF/Excel

### Phase 2 (Sprint 5-8) - AI & Advanced

Mục tiêu: mở rộng năng lực thông minh và tối ưu chất lượng sản phẩm.

- AI Smart Assign
- AI Auto Subtask Generation
- AI Chatbot (RAG với Elasticsearch)
- Performance AI Evaluation (mở rộng từ activity signals)
- Analytics mở rộng (workload by assignee, comment activity)
- Hardening, polish, defense preparation

---

## III. Sprint Plan (8 Sprints)

## Sprint 1 - Foundation & Auth

**Goal**: Thiết lập kiến trúc và hoàn thiện luồng xác thực.

- Setup backend/frontend skeleton
- JWT auth + OTP verify + forgot/reset password
- Profile cơ bản
- Flyway migration baseline

**DoD**

- Auth flows chạy ổn định
- API response format thống nhất

---

## Sprint 2 - Workspace & Project Core

**Goal**: Quản lý không gian làm việc và dự án.

- Workspace CRUD + invite members
- Project CRUD + membership + RBAC cơ bản
- UI dashboard workspace/project

**DoD**

- User tạo được workspace/project và thêm member theo role

---

## Sprint 3 - Task Management & Collaboration

**Goal**: Triển khai core task workflow.

- Task CRUD, checklist/subtask
- Kanban drag-drop với status cố định: TODO, IN_PROGRESS, REVIEW, DONE
- Comment + mention
- Notification bell (realtime scope cho notification)

**DoD**

- Task lifecycle chạy end-to-end
- Mention tạo notification đúng ngữ cảnh

---

## Sprint 4 - Search, Analytics, Attachments, Export (MVP Complete)

**Goal**: Chốt MVP có tìm kiếm và dashboard.

- Elasticsearch integration (Spring Data Elasticsearch)
- Batch sync PostgreSQL -> Elasticsearch
- Search cho Task/Project/User (VI + EN)
- KPI dashboard MVP:
  - Task throughput
  - Overdue trends
- File upload với MinIO
- Export PDF/Excel

**DoD**

- Search trả kết quả đúng với filter/sort/highlight
- KPI dashboard hiển thị đúng dữ liệu
- File upload và export hoạt động

---

## Sprint 5 - AI Foundation

**Goal**: Tạo nền tảng AI cho phase nâng cao.

- LLM integration layer
- Prompt/response contract
- Guardrail cơ bản + fallback
- Bắt đầu AI Smart Assign

**DoD**

- Pipeline AI gọi được với dữ liệu thật trong môi trường dev

---

## Sprint 6 - AI Feature Completion

**Goal**: Hoàn thiện AI nghiệp vụ chính.

- AI Smart Assign hoàn chỉnh
- AI Auto Subtask Generation
- AI Chatbot RAG (Elasticsearch retrieval)

**DoD**

- 3 tính năng AI chạy được trong demo flow

---

## Sprint 7 - Performance AI & Advanced Analytics

**Goal**: Mở rộng đánh giá hiệu suất từ activity signals.

- Performance AI evaluation (không dùng manual timer)
- Bổ sung analytics:
  - Workload by assignee
  - Comment activity
- Tối ưu query + quality dashboard

**DoD**

- Báo cáo hiệu suất có khả năng giải thích được từ dữ liệu hoạt động

---

## Sprint 8 - Stabilization & Final Delivery

**Goal**: Ổn định, chốt chất lượng và chuẩn bị bảo vệ.

- Regression test
- Bug fixing
- Demo script
- Slide + report final

**DoD**

- Demo ổn định toàn bộ flow chính
- Tài liệu và trình bày hoàn thiện

---

## IV. Backlog ưu tiên

### Must (MVP)

- Auth/Workspace/Project
- Task + Kanban + Comment + Notification bell
- MinIO attachments
- Elasticsearch search
- Dashboard 2 KPI (throughput, overdue trends)
- Export PDF/Excel

### Should (Phase 2)

- AI Smart Assign
- AI Auto Subtask Generation
- AI Chatbot RAG
- Performance AI evaluation
- Advanced analytics

---

## V. Risk & Mitigation

1. **Scope overload với 2 dev**

- Mitigation: khóa MVP ở Sprint 4, AI dồn Phase 2.

2. **Dữ liệu search/analytics lệch với DB nguồn**

- Mitigation: batch sync có retry + manual reindex command.

3. **AI không ổn định khi demo**

- Mitigation: fallback UX + mock response mode cho demo.

4. **Upload/storage issue**

- Mitigation: MinIO local ổn định trước; S3 để phase mở rộng.
