---
name: feature-implementation
description: "Use when the user needs implementation of a software feature from defined requirements, with minimal-risk code changes, preserved architecture conventions, and verification steps. Triggers include: build feature, modify endpoint, add UI flow, refactor module, and implement acceptance criteria."
---

# Feature Implementation

## Goal

Implement features safely and incrementally while preserving project conventions and behavior.

## When to Use

Use this skill when the user asks for:

- New feature implementation
- Existing feature enhancement
- Low-risk refactor tied to requirements
- Acceptance criteria-driven code changes

Do not use this skill for:

- Architecture-only decisions without coding
- Security exploit or harmful requests

## Inputs to Collect

1. Approved requirements and acceptance criteria
2. Relevant module boundaries and conventions
3. Existing APIs and data models
4. Test expectations and constraints
5. Rollback expectations

## Workflow

1. Map requirements to code touchpoints.
2. Implement smallest coherent changes.
3. Preserve public contracts unless required.
4. Add or update tests for changed behavior.
5. Validate and summarize implementation impact.

## Required Output Format

1. Implementation plan
2. Files to change and rationale
3. Code-level change summary
4. Test updates
5. Validation results
6. Known limitations and follow-ups

## Quality Bar

- Changes map directly to requirements
- No unrelated refactors
- Tests cover critical paths
- Regression risk is documented

## Guardrails

- Never introduce hidden behavior changes
- Never skip error handling updates for new flows
- Never claim completion without validation evidence

## Completion Checklist

- Acceptance criteria mapped to changes
- Tests added/updated for critical behavior
- Validation and residual risks documented
