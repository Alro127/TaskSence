# AI Context Index

## Read Protocol

Agents must read in this order:

1. This index file
2. Latest snapshot file in snapshots/
3. Latest 5 run files in runs/
4. LEDGER.md

## Latest Snapshot

- None yet

## Recent Runs

| Run ID             | Date       | Summary                                                                                                                              | Linked Files                                                    |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| RUN-2026-04-15-001 | 2026-04-15 | Refactored chatbot service into modular package and added end-to-end Agent Mode toggle with explicit FE->AI `agent` payload wiring. | ai chatbot service modules + agent page/api                     |
| RUN-2026-04-14-003 | 2026-04-14 | Cleared all AI Python type diagnostics via uv + pyright, including `__getitem__` TupleRow overload errors.                         | ai typing-critical modules                                      |
| RUN-2026-04-14-002 | 2026-04-14 | Bootstrapped Spring MCP server endpoint `/mcp/execute` with dispatcher for create task/project and update task status actions.      | server MCP controller/service/dto                               |
| RUN-2026-04-14-001 | 2026-04-14 | Introduced hybrid SQL-template + Qdrant retrieval, optimized chatbot prompts, and scaffolded agent->MCP action execution flow.      | ai chatbot modules + prompts + tests                            |
| RUN-2026-04-13-003 | 2026-04-13 | Added workflow `favorited` response field, new `/workflows/me/favorites` API, Favorites tab in My Workflows, and Explore CTA nav.    | workflow modules (server + client)                              |
| RUN-2026-04-13-002 | 2026-04-13 | Integrated real workflow comment APIs (CRUD/reply/reaction) into PublicWorkflowDetailPage reviews tab and replaced mock comments.    | client/src/features/workflow/pages/PublicWorkflowDetailPage.tsx |
| RUN-2026-04-13-001 | 2026-04-13 | Rebuilt public workflow detail page UI (steps + reviews tab) from provided design references while preserving clone/rating behavior. | client/src/features/workflow/pages/PublicWorkflowDetailPage.tsx |

## Open Decisions

| Date | Decision Needed | Owner | Due | Status |
| ---- | --------------- | ----- | --- | ------ |

## Active Constraints

| Date | Constraint | Impact |
| ---- | ---------- | ------ |

## Risk Register

| Date | Risk | Severity | Mitigation |
| ---- | ---- | -------- | ---------- |
