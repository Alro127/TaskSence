---
description: Produce a TaskSense implementation design, module plan, data flow, and rollout strategy.
handoffs:
  - label: Implement Feature
    agent: workflow.implement
    prompt: Implement according to this approved design
    send: true
  - label: Review Plan
    agent: workflow.review
    prompt: Review this plan for bugs, regressions, and missing tests
---

## User Input

```text
$ARGUMENTS
```

## Goal

Create an implementation-guiding architecture/plan for TaskSense changes.

## Context To Read

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/ai-context/INDEX.md`
- Latest relevant run files in `docs/ai-context/runs/`
- `docs/ai-context/LEDGER.md`
- Relevant source files for the touched module
- `client/DESIGN_SYSTEM.md` and `client/PROJECT_CONTEXT.md` for UI work

## Workflow

1. Define context, constraints, and affected surfaces.
2. Compare 2-3 feasible implementation options when architecture choices are meaningful.
3. Select a recommended option with rationale.
4. Map data/control flow across frontend, backend, AI service, DB, Redis, Elasticsearch, or MCP as applicable.
5. Identify API contract changes and DTO/type sync needs.
6. Define implementation slices, migration strategy, and validation plan.
7. List risks, mitigations, and rollback notes.

## Output Format

1. Context and constraints
2. Architecture options
3. Trade-off matrix
4. Recommended design
5. Data and integration flow
6. Implementation milestones
7. Risks, mitigations, and validation plan

## Guardrails

- Do not provide one architecture option without alternatives when the choice is non-trivial.
- Do not skip API contract alignment for cross-stack changes.
- Do not recommend modifying existing Flyway migrations.
