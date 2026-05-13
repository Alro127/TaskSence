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

- Date: 2026-05-12
- Source: Run context sync (RUN-2026-05-12-001)

## Durable Decisions

| Date | Area | Decision | Rationale |
| ---- | ---- | -------- | --------- |
| 2026-04-14 | AI Retrieval | Use hybrid retrieval (SQL template router + Qdrant vector retrieval) for chatbot question answering. | Improves precision for ownership/list queries while preserving semantic recall for fuzzy questions. |
| 2026-04-14 | AI Action Execution | Mutation-style requests are delegated from AI service to Spring MCP endpoint scaffold. | Keeps write-side authority in backend domain service and allows AI module to focus on planning/orchestration. |
| 2026-04-14 | MCP Backend API | Expose `/mcp/execute` dispatcher that validates actor identity and routes to existing domain services. | Avoids bypassing business rules while enabling AI-driven command execution through one stable integration point. |
| 2026-04-15 | Agent Mode Contract | Frontend sends explicit `agent` boolean in `/api/v1/ai/chat/{session_id}` payload and AI pipeline uses it to run action-agent-first logic. | Makes agent behavior deterministic, user-controlled at UI level, and backward-compatible when disabled. |
| 2026-05-12 | MCP Backend API | Start migrating from custom REST `/mcp/execute` toward official Spring AI MCP tools by adding a `@Tool` facade for `create_task`, `create_project`, and `create_workspace`. | Aligns Java MCP with Spring AI support while preserving existing domain service authorization and compatibility during migration. |
| 2026-05-12 | Agent Mode Contract | AI controller forwards the authenticated user JWT to compatibility MCP calls and the planner rejects core create actions with missing required IDs/fields. | Moves Agent Mode toward safer user-scoped execution while official MCP transport migration is pending. |
| 2026-05-12 | AI Retrieval | Add deterministic reranking after SQL/Qdrant merge, including SQL-template priority and intent/entity/query-token boosts. | Improves context ordering without introducing a new model dependency or sacrificing SQL-template determinism. |
| 2026-05-12 | Workflow Execution | Workflow-related MCP support must wrap existing stable workflow logic first; current action is `create_workflow_from_project` over `WorkflowService.createWorkflowFromProject`. | Preserves working workflow behavior while still giving Agent Mode a workflow-capable MCP action. |
| 2026-05-12 | Agent Mode UX | Agent reasoning is returned in AI chat responses, persisted as assistant context, and displayed in the frontend chat UI. | Users need visibility into why the AI chose an action before trusting Agent Mode execution. |
| 2026-05-13 | MCP Transport | Python Agent MCP client supports official Streamable HTTP JSON-RPC calls with compatibility REST fallback controlled by `SPRING_MCP_TRANSPORT`. | Enables gradual migration from `/mcp/execute` to Spring AI MCP tools without blocking local testing. |
| 2026-05-13 | AI Provider | SiliconFlow can be selected with `LLM_PROVIDER=siliconflow` for both chat and embeddings using OpenAI-compatible API settings; defaults are `https://api.siliconflow.cn/v1`, `deepseek-ai/DeepSeek-V3`, and `BAAI/bge-m3`. | Adds a China-friendly/model-flexible provider without changing LangChain call sites. |

## Durable Constraints

| Date | Constraint | Impact |
| ---- | ---------- | ------ |

## Durable Risks

| Date | Risk | Severity | Mitigation |
| ---- | ---- | -------- | ---------- |
| 2026-05-12 | AI-to-Java MCP authentication remains undecided, so tool calls could fail or be unsafe if actor identity is trusted incorrectly. | High | Choose JWT forwarding or a validated service-token delegation model before enabling broad Agent Mode writes. |
| 2026-05-12 | Spring AI MCP tool facade has compile coverage but not runtime discovery/e2e tool-call coverage. | Medium | Run the app with local infra and add MCP discovery plus tool-call tests before wiring Python Agent Mode to it. |
| 2026-05-13 | Frontend dependency audit shows moderate/high vulnerabilities after `npm install`. | Medium | Triage with `npm audit` and apply targeted dependency updates in a separate hardening task. |
