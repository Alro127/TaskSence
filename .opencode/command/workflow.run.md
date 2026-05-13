---
description: Run the TaskSense end-to-end agent execution workflow for a software delivery request.
handoffs:
  - label: Sync Context
    agent: workflow.context-sync
    prompt: Sync this run into the AI context docs
  - label: Review Gate
    agent: workflow.review
    prompt: Review the completed change for merge readiness
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding. If it is empty, ask for the requested outcome.

## Goal

Run the same software-delivery workflow currently documented for GitHub Copilot skills, but as a local OpenCode command for this workspace.

## Required Context Load

Before planning or implementation, read project context in this order:

1. `AGENTS.md`
2. `.github/copilot-instructions.md`
3. `docs/ai-context/INDEX.md`
4. Latest snapshot in `docs/ai-context/snapshots/` if present
5. Latest 5 run files in `docs/ai-context/runs/`
6. `docs/ai-context/LEDGER.md`
7. For frontend UI work, also read `client/DESIGN_SYSTEM.md` and `client/PROJECT_CONTEXT.md`

## Workflow

1. **Intake and Requirements**
   - Clarify objective, business outcome, acceptance criteria, constraints, and out-of-scope items.
   - Continue with explicit assumptions if non-critical inputs are missing.

2. **Plan and Plan Gate**
   - Map requirements to affected modules and files.
   - Produce an implementation plan with validation strategy.
   - Review the plan for correctness, security, regressions, data contracts, and missing tests.
   - Do not implement if unresolved critical plan risks remain.

3. **Implementation**
   - Make the smallest coherent changes.
   - Preserve public API wrappers: `ApiResponse<T>` and `PageResponse<T>`.
   - Keep backend layering: `controller -> service -> repository -> domain/dto`.
   - Keep frontend feature-first structure and register any new RTK Query API slices in `client/src/app/store.ts`.
   - Do not modify old Flyway migrations; add new migration files when schema changes are needed.

4. **Parallel Verification Mindset**
   - Requirements compliance: verify the change satisfies the original request.
   - Plan compliance: verify the implementation matches the approved plan.
   - Security check: auth/authz, validation, secrets, data exposure, config risks.
   - Test/quality check: run the narrowest relevant checks first, then broader checks if needed.

5. **Release Gate**
   - Decide GO/NO-GO based on evidence.
   - List blockers, residual risks, and follow-ups.

6. **Context Finalization**
   - For significant runs, call `/workflow.context-sync` or manually update:
     - `docs/ai-context/runs/RUN-YYYY-MM-DD-###.md`
     - `docs/ai-context/INDEX.md`
     - `docs/ai-context/LEDGER.md` when durable decisions/risks changed

## Output Format

1. Clarified requirements and assumptions
2. Loaded context summary
3. Approved plan and validation result
4. Implementation summary and changed files
5. Verification matrix with commands/results
6. Release gate result
7. Context sync result
8. Follow-up actions

## Guardrails

- Do not require users to name skills manually; infer the phase from intent.
- Do not skip context loading before planning.
- Do not start implementation without plan validation for multi-step changes.
- Do not claim completion without validation evidence or an explicit reason validation could not run.
- Do not close significant work without context sync unless the user explicitly says to skip docs.
