---
description: Decide TaskSense release readiness with functionality, quality, security, rollback, and operations checks.
---

## User Input

```text
$ARGUMENTS
```

## Goal

Produce a GO/NO-GO release decision for a feature, branch, sprint, or demo scope.

## Context To Read

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/ProjectPlan.md`
- `docs/ai-context/INDEX.md`
- `docs/ai-context/LEDGER.md`
- Latest relevant run records in `docs/ai-context/runs/`
- `CODE_REVIEW_REPORT.md` for known blockers

## Workflow

1. Define release scope and impacted services.
2. Check functional completeness against requirements/acceptance criteria.
3. Check validation evidence: builds, tests, lint, manual checks, known gaps.
4. Check security and privacy status.
5. Check operational readiness: config, local infra, migrations, rollback, observability.
6. List blockers, mitigations, owners/actions, and final recommendation.

## Output Format

1. Release scope summary
2. Readiness checks PASS/FAIL/UNKNOWN
3. Blocking issues
4. Mitigation and owner/action list
5. GO/NO-GO recommendation

## Guardrails

- Never recommend GO with unresolved critical blockers.
- Do not hide uncertainty; mark missing evidence as UNKNOWN.
- Include rollback/observability notes for backend or data changes.
