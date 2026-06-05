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
| RUN-2026-06-05-002 | 2026-06-05 | Moved deployment KT into existing `docs/` folder and expanded it for a learner without deployment/Kubernetes background.              | docs/TASKSENSE_DEPLOYMENT_KT.md                                 |
| RUN-2026-06-05-001 | 2026-06-05 | Created deployment KT covering TaskSense server setup, Docker Compose deployment, Kubernetes mapping, K8s rollout plan, and infra improvement priorities. | docs/TASKSENSE_DEPLOYMENT_KT.md                                 |
| RUN-2026-05-15-002 | 2026-05-15 | Split oversized AI source-truth, retriever, and SQL router files into focused modules and tightened AI Docker build context/runtime command. | ai source_truth/retriever/sql_router modules + Dockerfile/.dockerignore |
| RUN-2026-05-15-001 | 2026-05-15 | Added backend health/Prometheus observability endpoints, custom wrapped health API, health metrics, and focused unit tests. | server health/metrics + docs context                            |
| RUN-2026-05-12-001 | 2026-05-12 | Added Spring AI MCP facade, safer Agent Mode actions/JWT forwarding, deterministic RAG reranking, workflow MCP wrapper, and visible reasoning UI. | server MCP + ai agent/RAG + client agent UI                     |
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
| 2026-05-12 | Choose AI service -> Java MCP auth model: forward user JWT vs service token with delegated identity. | Backend/AI | TBD | Open |

## Active Constraints

| Date | Constraint | Impact |
| ---- | ---------- | ------ |

## Risk Register

| Date | Risk | Severity | Mitigation |
| ---- | ---- | -------- | ---------- |
| 2026-05-12 | MCP tool discovery/e2e calls are unverified even though backend compile now passes. | Medium | Run the Spring app with local infra and validate MCP tool listing plus create-tool calls. |
| 2026-05-13 | Frontend dependency audit reports 11 vulnerabilities after restoring `client/node_modules`. | Medium | Review `npm audit` output separately before release; avoid blind `npm audit fix` if it changes major versions. |
