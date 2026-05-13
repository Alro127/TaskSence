---
description: Implement a TaskSense feature or bug fix using the local workflow rules and validation gates.
handoffs:
  - label: Review Gate
    agent: workflow.review
    prompt: Review this implementation for merge readiness
  - label: Security Check
    agent: workflow.security
    prompt: Security-check this implementation
  - label: Sync Context
    agent: workflow.context-sync
    prompt: Sync this completed run into context docs
---

## User Input

```text
$ARGUMENTS
```

## Goal

Implement the requested change safely, incrementally, and consistently with TaskSense conventions.

## Required Pre-Work

1. Read `AGENTS.md` and `.github/copilot-instructions.md`.
2. Load AI context docs if this is a significant multi-step change:
   - `docs/ai-context/INDEX.md`
   - Latest run files in `docs/ai-context/runs/`
   - `docs/ai-context/LEDGER.md`
3. Inspect existing module patterns before editing.
4. Create a plan for non-trivial work and validate it before implementation.

## Implementation Rules

- Keep changes minimal and task-focused.
- Preserve existing public contracts unless the task explicitly requires a contract change.
- Keep backend controllers thin; use service-layer transactions and permission checks.
- Keep frontend API types aligned with backend DTOs in `client/src/types/api.ts`.
- Use `getApiErrorMessage(err, fallback)` for frontend mutation errors.
- Use Sonner toast patterns already present in the codebase.
- Do not edit generated UI primitives under `client/src/components/ui` unless explicitly requested.
- Add new DB schema changes as new Flyway migrations under `server/src/main/resources/db/migration`.

## Validation Commands

Choose the narrowest relevant checks:

- Frontend lint: `npm run lint` from `client/`
- Frontend build: `npm run build` from `client/`
- Backend compile: `./mvnw -DskipTests compile` from `server/`
- Backend tests: `./mvnw test` from `server/`
- AI typing/checks: use the existing `uv`/`pyright`/`pytest` pattern from recent run docs when touching `ai/`

If a check cannot run due to missing local services or dependencies, state that explicitly and provide the closest validation performed.

## Output Format

1. Implementation plan
2. Files changed and rationale
3. Code-level change summary
4. Tests/validation run
5. Requirement/plan/security compliance result
6. Known limitations and follow-ups

## Guardrails

- Never introduce unrelated refactors.
- Never leave behavior-changing work without validation evidence.
- Never overwrite user changes or revert unrelated work.
