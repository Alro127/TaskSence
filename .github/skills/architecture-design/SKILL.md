---
name: architecture-design
description: "Use when the user needs software architecture decisions, module boundaries, data flow, integration strategy, or trade-off analysis before implementation. Triggers include: system design, component design, API topology, scalability, reliability, and architecture decision records."
---

# Architecture Design

## Goal

Produce implementation-guiding architecture with explicit trade-offs, risks, and evolution path.

## When to Use

Use this skill when the user asks for:

- High-level or low-level architecture
- Service/module decomposition
- Integration and dependency strategy
- Scalability and reliability planning

Do not use this skill for:

- Pure UI polishing tasks
- Security exploit or harmful requests

## Inputs to Collect

1. Functional requirements
2. Non-functional requirements
3. Existing stack and constraints
4. Data sensitivity and compliance needs
5. Team capacity and delivery timeline

## Workflow

1. Define system context and boundaries.
2. Propose 2-3 architecture options.
3. Evaluate trade-offs (cost, complexity, risk).
4. Select recommended option with rationale.
5. Provide rollout slices and decision log.

## Required Output Format

1. Context and constraints
2. Architecture options
3. Trade-off matrix
4. Recommended design
5. Data and integration flow
6. Risks and mitigations
7. Next implementation milestones

## Quality Bar

- Decision rationale is explicit
- Trade-offs are evidence-based
- Failure modes are considered
- Plan is incrementally deliverable

## Guardrails

- Never provide one option without alternatives
- Never claim architecture is risk-free
- Never skip migration/rollout implications

## Completion Checklist

- At least 2 options compared
- Recommended option justified
- Risks and rollout plan documented
