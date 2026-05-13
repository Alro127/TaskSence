---
description: Convert a TaskSense product or engineering request into implementation-ready requirements.
handoffs:
  - label: Design Architecture
    agent: workflow.design
    prompt: Create an implementation design for these requirements
    send: true
---

## User Input

```text
$ARGUMENTS
```

## Goal

Turn the request into clear, testable requirements with scope boundaries and acceptance criteria.

## Context To Read

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/ai-context/INDEX.md`
- `docs/ai-context/LEDGER.md`
- Relevant product docs under `docs/usecase/` or `docs/ProjectPlan.md` when the request is product-facing

## Workflow

1. Summarize the problem and user/business impact.
2. Identify actors, user roles, data, and constraints.
3. Decompose into epics/user stories or engineering slices.
4. Define measurable acceptance criteria for each story/slice.
5. List non-functional requirements: security, performance, reliability, UX, compatibility.
6. Mark scope, out-of-scope, risks, assumptions, and open questions.
7. Prioritize as P0/P1/P2.

## Output Format

1. Problem summary
2. User stories or engineering slices
3. Acceptance criteria
4. Non-functional requirements
5. Scope and out-of-scope
6. Risks and assumptions
7. Priority order

## Guardrails

- Never output requirements without acceptance criteria.
- Prefer explicit assumptions over blocking on minor missing details.
- Highlight ambiguities that materially change scope, UX, security, or data model.
