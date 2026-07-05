# Project Plan: TaskSense (Aligned Scope)

> This version is synchronized according to the new decision: **MVP without AI**, uses **Elasticsearch for basic Search + Analytics**, AI moves to **Phase 2**.

## I. Overview

| Category | Details |
| :------------- | :-------------------------------------------------------- |
| Time | 15 weeks (February 27, 2026 - June 29, 2026) |
| Human Resources | 2 fullstack members |
| Model | Workspace-based for small teams of 5-15 people |
| Main Stack | Spring Boot + React + PostgreSQL + Elasticsearch |
| MVP Deployment | Local Docker Compose (Postgres + Elasticsearch + MinIO) |

---

## II. Phase Strategy

### Phase 1 (Sprint 1-4) - MVP Delivery

Goal: bring a product that works end-to-end for a small team, with basic search + dashboard.

- Auth + Basic profile
- Workspace + Project + Membership
- Task CRUD + Kanban + fixed workflow status
- Comment + Mention + Notification bell
- File upload (MinIO)
- Elasticsearch Search + Analytics (2 KPIs)
- Export PDF/Excel

### Phase 2 (Sprint 5-8) - AI & Advanced

Objective: expand smart capacity and optimize product quality.

- AI Smart Assign
- AI Auto Subtask Generation
- AI Chatbot (RAG with Elasticsearch)
- Performance AI Evaluation (extended from activity signals)
- Expanded analytics (workload by assignee, comment activity)
- Hardening, polishing, defense preparation

---

##III. Sprint Plan (8 Sprints)

## Sprint 1 - Foundation & Auth

**Goal**: Set up the architecture and complete the authentication flow.

- Setup backend/frontend skeleton
- JWT auth + OTP verify + forgot/reset password
- Basic profiles
- Flyway migration baseline

**DoD**

- Auth flows run stably
- Uniform API response format

---

## Sprint 2 - Workspace & Project Core

**Goal**: Manage workspaces and projects.

- Workspace CRUD + invite members
- Project CRUD + membership + basic RBAC
- UI dashboard workspace/project

**DoD**

- User can create workspace/project and add members according to role

---

## Sprint 3 - Task Management & Collaboration

**Goal**: Implement core task workflow.

- Task CRUD, checklist/subtask
- Kanban drag-drop with fixed status: TODO, IN_PROGRESS, REVIEW, DONE
- Comment + mention
- Notification bell (realtime scope for notifications)

**DoD**

- Task lifecycle runs end-to-end
- Mention creates notifications in the right context

---

## Sprint 4 - Search, Analytics, Attachments, Export (MVP Complete)

**Goal**: Final MVP with search and dashboard.

- Elasticsearch integration (Spring Data Elasticsearch)
- Batch sync PostgreSQL -> Elasticsearch
- Search for Task/Project/User (VI + EN)
- KPI dashboard MVP:
  - Task throughput
  - Overdue trends
- File upload with MinIO
- Export PDF/Excel

**DoD**

- Search returns correct results with filter/sort/highlight
- KPI dashboard displays correct data
- File upload and export work

---

## Sprint 5 - AI Foundation

**Goal**: Create an AI foundation for the advanced phase.

- LLM integration layer
- Prompt/response contract
- Basic guardrail + fallback
- Start AI Smart Assign

**DoD**

- Pipeline AI can be called with real data in the dev environment

---

## Sprint 6 - AI Feature Completion

**Goal**: Complete main business AI.

- Complete AI Smart Assign
- AI Auto Subtask Generation
- AI Chatbot RAG (Elasticsearch retrieval)

**DoD**

- 3 AI features running in demo flow

---

## Sprint 7 - Performance AI & Advanced Analytics

**Goal**: Expands performance assessment from activity signals.

- Performance AI evaluation (do not use manual timer)
- Additional analytics:
  - Workload by assignee
  - Comment activity
- Optimize query + quality dashboard

**DoD**

- Explainable performance reports from operational data

---

## Sprint 8 - Stabilization & Final Delivery

**Goal**: Stability, quality assurance and protection preparation.

- Regression testing
- Bug fixing
- Demo scripts
- Slide + final report

**DoD**

- Demo stabilizes the entire main flow
- Complete documentation and presentation

---

## IV. Priority backlog

### Must (MVP)

- Auth/Workspace/Project
- Task + Kanban + Comment + Notification bell
- MinIO attachments
- Elasticsearch search
- Dashboard 2 KPIs (throughput, overdue trends)
- Export PDF/Excel

### Should (Phase 2)

- AI Smart Assign
- AI Auto Subtask Generation
- AI Chatbot RAG
- Performance AI evaluation
- Advanced analytics

---

## V. Risk & Mitigation

1. **Scope overload with 2 devs**

- Mitigation: lock MVP in Sprint 4, AI rushes Phase 2.

2. **Search/analytics data is different from the source database**

- Mitigation: batch sync has retry + manual reindex command.

3. **AI is unstable during demo**

- Mitigation: fallback UX + mock response mode for demo.

4. **Upload/storage issue**

- Mitigation: MinIO local stabilizes first; S3 for extended phase.