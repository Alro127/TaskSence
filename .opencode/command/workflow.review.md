---
description: Run a strict TaskSense code review gate focused on bugs, regressions, security, and missing tests.
---

## User Input

```text
$ARGUMENTS
```

## Goal

Review current or specified changes before merge/release. Prioritize defects over summaries.

## Context To Read

- `AGENTS.md`
- `.github/copilot-instructions.md`
- Relevant changed files and tests
- Relevant API types/DTOs when contracts changed
- `CODE_REVIEW_REPORT.md` when reviewing broad readiness or known technical debt

## Workflow

1. Identify change scope and intended behavior.
2. Inspect modified files and directly related dependencies.
3. Check correctness, edge cases, regressions, API compatibility, and state transitions.
4. Check security/authz/data exposure where relevant.
5. Check test coverage and validation evidence.
6. Produce severity-ranked findings and a merge recommendation.

## Output Format

Findings first, ordered by severity:

1. Critical findings
2. Major findings
3. Minor findings
4. Missing tests and suggested additions
5. Merge recommendation: PASS/BLOCK

Each finding must include file/line reference where possible, impact, and suggested fix.

## Guardrails

- Do not approve with unresolved critical issues.
- Do not report style-only notes as major defects.
- If no findings are found, say so and list residual risks/testing gaps.
