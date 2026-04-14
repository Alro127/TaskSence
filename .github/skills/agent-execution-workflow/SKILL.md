---
name: agent-execution-workflow
description: "Use when the user needs an end-to-end multi-agent execution process for software delivery, including requirement clarification, context loading, planning, plan review, implementation, parallel validation, release readiness checks, and final context sync. Triggers include: agent workflow, orchestration process, execution pipeline, multi-agent handoff, and AI SDLC process."
---

# Agent Execution Workflow

## Goal

Run a predictable, high-quality multi-agent software workflow from request intake to final documentation sync.

## When to Use

Use this skill when the user asks for:

- End-to-end process for agents using skills
- Orchestration and handoff between specialized agents
- Parallel validation during planning and implementation
- Release gating and post-run context continuity

Do not use this skill for:

- Single-step ad-hoc answers that do not involve software delivery workflow
- Harmful or policy-violating content

## Inputs to Collect

1. User request and expected business outcome
2. Existing context documents and latest decisions
3. Constraints (time, scope, tools, security, compliance)
4. Required quality bars and release criteria
5. Target deliverables

If critical inputs are missing, continue with explicit assumptions and mark open questions.

## Workflow

1. Intake and Context Load

- Use requirements-analysis to clarify request scope and acceptance criteria.
- In parallel, use context-doc-sync read protocol to load prior context from ai-context documents.

2. Plan and Plan Validation

- Use architecture-design (or equivalent planning skill) to produce implementation plan.
- In parallel, use code-review-gate mindset to validate plan correctness, risk, and feasibility.
- Block implementation if plan has unresolved critical findings.

3. Implement and Parallel Verification

- Use feature-implementation for execution.
- In parallel run:
  - Requirements compliance check (does implementation satisfy original request)
  - Plan compliance check (does implementation match approved design)
  - security-check (auth, data, dependency, config risks)

4. Quality and Release Gate

- Use test-generation and execution to validate behavior.
- Use release-readiness to decide go/no-go.
- If blocked, return to implementation with targeted fixes.

5. Context Finalization

- Use context-doc-sync to write run record, update index, update ledger, and compact context if needed.

## Required Output Format

1. Clarified requirements and assumptions
2. Loaded context summary
3. Approved implementation plan and validation result
4. Implementation summary and verification matrix
5. Release gate result (go/no-go)
6. Context sync result
7. Follow-up actions

## Output Quality Bar

A high-quality output must be:

- Deterministic: clear phase transitions and gate decisions
- Traceable: every decision linked to requirement/plan/evidence
- Safe: includes security and release checks before completion
- Efficient: parallel checks used where possible
- Durable: context is synced for next run continuity

## Guardrails

- Never skip context loading before planning
- Never start implementation without plan validation
- Never pass release gate without test and security evidence
- Never close the run without context sync

## Completion Checklist

Before finishing, verify:

- Requirements are clarified with acceptance criteria
- Context files were loaded using documented read order
- Plan passed validation gates
- Implementation passed requirement/plan/security checks
- Release readiness is explicit (go/no-go)
- Context docs are updated and compacted if threshold reached
