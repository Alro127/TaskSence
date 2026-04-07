---
name: security-check
description: "Use when the user needs security and privacy checks for application code, dependencies, configuration, and data handling before release. Triggers include: vulnerability review, secret exposure checks, auth/authorization validation, input validation, and secure coding verification."
---

# Security Check

## Goal

Identify and reduce security and privacy risks in code and configuration before release.

## When to Use

Use this skill when the user asks for:

- Security review of changes
- Dependency vulnerability triage
- Auth/authz and input validation checks
- Sensitive data handling verification

Do not use this skill for:

- Offensive exploitation requests
- Pure feature design unrelated to security

## Inputs to Collect

1. Change set and affected surfaces
2. Auth, session, and permission model
3. Data classification and sensitive fields
4. Dependency versions and known advisories
5. Deployment/runtime context

## Workflow

1. Map attack surface of changed components.
2. Check common vulnerability classes.
3. Validate auth/authz and data protection controls.
4. Review dependency and configuration risks.
5. Provide prioritized mitigations and verification steps.

## Required Output Format

1. Threat surface summary
2. Findings by severity
3. Immediate mitigations
4. Follow-up hardening tasks
5. Verification checklist

## Quality Bar

- Findings are tied to concrete code/config evidence
- Severity reflects exploitability and impact
- Mitigations are practical and prioritized
- Verification steps are explicit

## Guardrails

- Never expose or repeat secrets
- Never provide exploit instructions
- Never mark high-risk issues as optional

## Completion Checklist

- Severity-ranked security findings listed
- Immediate and long-term mitigations included
- Verification checklist provided
