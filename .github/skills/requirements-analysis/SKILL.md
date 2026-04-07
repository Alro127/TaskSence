---
name: requirements-analysis
description: "Use when the user needs to turn product ideas into clear software requirements, including user stories, acceptance criteria, scope boundaries, and ambiguity reduction before design or coding. Triggers include: requirement breakdown, user story writing, acceptance criteria, functional/non-functional requirements, and scope clarification."
---

# Requirements Analysis

## Goal

Convert ambiguous requests into implementation-ready requirements with measurable acceptance criteria.

## When to Use

Use this skill when the user asks for:

- Requirement clarification
- User story decomposition
- Acceptance criteria definition
- Functional and non-functional requirement extraction

Do not use this skill for:

- Direct coding tasks without requirement uncertainty
- Security exploit or harmful requests

## Inputs to Collect

1. Problem statement
2. Target users and roles
3. Business goal and expected outcome
4. Constraints (time, budget, compliance, platform)
5. Out-of-scope boundaries

If critical input is missing, continue with explicit assumptions.

## Workflow

1. Summarize objective and user impact.
2. Decompose into epics and user stories.
3. Define acceptance criteria per story.
4. List non-functional requirements and risks.
5. Produce a prioritized implementation slice.

## Required Output Format

1. Problem summary
2. User stories
3. Acceptance criteria
4. Non-functional requirements
5. Scope and out-of-scope
6. Risks and assumptions
7. Priority order (P0/P1/P2)

## Quality Bar

- Stories are testable and independent
- Acceptance criteria are measurable
- Scope boundaries are explicit
- Ambiguities are highlighted

## Guardrails

- Never output requirements without acceptance criteria
- Never ignore constraints from user context
- Never hide assumptions

## Completion Checklist

- At least one acceptance criterion per story
- Risks and assumptions listed
- Priority and scope clearly stated
