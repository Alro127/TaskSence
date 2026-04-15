# AI Context Ledger

## Stable Context

- Product: TaskSense monorepo
- Frontend: React + TypeScript + RTK Query
- Backend: Spring Boot + Java 21
- API response conventions: ApiResponse and PageResponse
- Key references:
  - client/DESIGN_SYSTEM.md
  - client/PROJECT_CONTEXT.md
  - .github/copilot-instructions.md
  - AGENTS.md

## Last Updated

- Date: 2026-04-15
- Source: Run context sync (RUN-2026-04-15-001)

## Durable Decisions

| Date | Area | Decision | Rationale |
| ---- | ---- | -------- | --------- |
| 2026-04-14 | AI Retrieval | Use hybrid retrieval (SQL template router + Qdrant vector retrieval) for chatbot question answering. | Improves precision for ownership/list queries while preserving semantic recall for fuzzy questions. |
| 2026-04-14 | AI Action Execution | Mutation-style requests are delegated from AI service to Spring MCP endpoint scaffold. | Keeps write-side authority in backend domain service and allows AI module to focus on planning/orchestration. |
| 2026-04-14 | MCP Backend API | Expose `/mcp/execute` dispatcher that validates actor identity and routes to existing domain services. | Avoids bypassing business rules while enabling AI-driven command execution through one stable integration point. |
| 2026-04-15 | Agent Mode Contract | Frontend sends explicit `agent` boolean in `/api/v1/ai/chat/{session_id}` payload and AI pipeline uses it to run action-agent-first logic. | Makes agent behavior deterministic, user-controlled at UI level, and backward-compatible when disabled. |

## Durable Constraints

| Date | Constraint | Impact |
| ---- | ---------- | ------ |

## Durable Risks

| Date | Risk | Severity | Mitigation |
| ---- | ---- | -------- | ---------- |
