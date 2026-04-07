---
name: api-contract-sync
description: "Use when backend and frontend API contracts must be aligned, including request/response schemas, versioning, pagination, error envelopes, and DTO/type synchronization. Triggers include: API mismatch, contract drift, DTO changes, type updates, and backward compatibility checks."
---

# API Contract Sync

## Goal

Keep API contracts consistent across backend and frontend to prevent integration defects.

## When to Use

Use this skill when the user asks for:

- DTO and type alignment
- Response envelope or pagination updates
- API version compatibility checks
- Contract drift detection and correction

Do not use this skill for:

- Pure infrastructure issues unrelated to API contracts
- Security exploit or harmful requests

## Inputs to Collect

1. Backend endpoint definitions
2. Frontend API types and usage points
3. Contract conventions (envelope, pagination, errors)
4. Versioning/backward compatibility constraints
5. Known mismatch symptoms

## Workflow

1. Compare backend DTOs and frontend types.
2. Identify breaking vs non-breaking differences.
3. Propose synchronized contract changes.
4. Update compatibility and migration notes.
5. Define validation checks for consumers.

## Required Output Format

1. Contract mismatch summary
2. Proposed synchronized schema
3. Breaking change analysis
4. Frontend/backend update checklist
5. Compatibility and migration notes
6. Validation test matrix

## Quality Bar

- Contract differences are explicit
- Breaking changes are clearly labeled
- Migration guidance is actionable
- Validation coverage includes edge cases

## Guardrails

- Never change contract silently without impact notes
- Never omit error schema alignment
- Never skip pagination and envelope consistency

## Completion Checklist

- Mismatches listed with severity
- Sync plan includes both sides
- Validation matrix included
