---
description: Check TaskSense changes for security, privacy, auth, validation, dependency, and config risks.
---

## User Input

```text
$ARGUMENTS
```

## Goal

Identify and reduce security/privacy risks in code, config, dependencies, and data flows.

## Context To Read

- `AGENTS.md`
- `.github/copilot-instructions.md`
- Changed files and adjacent auth/authz code
- `server/src/main/resources/application.yaml` for backend config risk when relevant
- `CODE_REVIEW_REPORT.md` for known existing security debt

## Workflow

1. Map changed attack surface: endpoints, UI inputs, AI actions, DB writes, file upload, background workers.
2. Review authentication and authorization controls.
3. Review validation, serialization, and error handling.
4. Review secrets/config, logging, and sensitive data exposure.
5. Review dependencies and external calls when touched.
6. Provide prioritized mitigations and verification steps.

## Output Format

1. Threat surface summary
2. Findings by severity
3. Immediate mitigations
4. Follow-up hardening tasks
5. Verification checklist

## Guardrails

- Never expose or repeat secrets.
- Never provide exploit instructions.
- Never mark high-risk auth or data exposure issues as optional.
