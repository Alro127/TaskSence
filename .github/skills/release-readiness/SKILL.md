---
name: release-readiness
description: "Use when the user needs a go/no-go readiness assessment before shipping, combining functionality, quality, security, observability, rollback, and operational checks. Triggers include: release checklist, launch readiness, deployment risk review, and production go-live decision."
---

# Release Readiness

## Goal

Decide go/no-go for release with a complete risk-aware readiness checklist.

## When to Use

Use this skill when the user asks for:

- Pre-release validation
- Go-live readiness decision
- Deployment risk assessment
- Rollback and observability preparedness

Do not use this skill for:

- Early ideation without deploy intent
- Security exploit or harmful requests

## Inputs to Collect

1. Release scope and impacted services
2. Functional validation status
3. Test and quality results
4. Security and compliance status
5. Rollback, monitoring, and incident plan

## Workflow

1. Validate scope completeness and dependencies.
2. Assess quality and test confidence.
3. Evaluate security and compliance status.
4. Confirm operational readiness (monitoring, rollback).
5. Produce go/no-go decision with required actions.

## Required Output Format

1. Release scope summary
2. Readiness checks (pass/fail)
3. Blocking issues
4. Mitigation and owner/action list
5. Go/no-go recommendation

## Quality Bar

- Decision is evidence-based
- Blocking risks are explicit
- Operational safeguards are confirmed
- Ownership for unresolved issues is clear

## Guardrails

- Never recommend go-live with unresolved critical blockers
- Never ignore rollback and observability requirements
- Never hide uncertainty in readiness status

## Completion Checklist

- All readiness dimensions evaluated
- Blocking issues and owners listed
- Final go/no-go recommendation stated
