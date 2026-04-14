---
name: ai-productivity-coach
description: "Use when the user asks how to use AI more effectively, improve personal/team AI workflow, design high-productivity prompting systems, or build measurable AI operating routines for software and technology work. Triggers include: AI productivity, prompt framework, agent specialization, workflow optimization, quality gates, and ROI/KPI for AI usage."
---

# AI Productivity Coach

## Goal

Help the user design and improve a high-efficiency AI workflow for software and technology work, with concrete, measurable, and immediately executable actions.

## When to Use

Use this skill when the user asks for:

- Better ways to use AI at work
- Agent specialization strategy
- Prompt workflow optimization
- AI governance, quality, and safety controls
- KPI or ROI measurement for AI usage

Do not use this skill for:

- Pure code implementation requests without workflow/process intent
- Security exploit or harmful content

## Inputs to Collect

Collect or infer the following before giving a final plan:

1. User role and scope (individual, tech lead, team, org)
2. Main task categories (coding, review, architecture, docs, research)
3. Current pain points (speed, quality, consistency, rework)
4. Constraints (time, tools, compliance, data sensitivity)
5. Success criteria (what "better" means quantitatively)

If any critical input is missing, proceed with explicit assumptions and label them clearly.

## Workflow

1. Baseline Assessment

- Summarize current way of working (from user context)
- Identify top 3 bottlenecks and top 3 leverage points

2. Agent Specialization Design

- Propose role-based agent model:
  - Research Agent
  - Planner/Architect Agent
  - Builder Agent
  - Reviewer/QA Agent
- Define handoff artifacts between roles (brief, checklist, test criteria, decision log)

3. High-Performance Prompt System

- Provide reusable prompt templates for each role:
  - Objective
  - Context
  - Constraints
  - Output format
  - Validation criteria
- Add anti-hallucination requirements: assumptions, source grounding, uncertainty labels

4. Quality Gates

- Add mandatory checks before accepting output:
  - Correctness gate
  - Consistency gate
  - Security/privacy gate
  - Testability gate

5. Measurement and Iteration

- Define KPI set (lead time, defect rate, rework rate, cycle efficiency)
- Provide a 2-4 week experiment plan
- Include review cadence and template for retrospective

## Required Output Format

Always return final recommendations in this structure:

1. Current-state diagnosis (short)
2. Target operating model (agents and responsibilities)
3. Immediate actions (next 24h)
4. 7-day implementation plan
5. KPI dashboard (what to track and thresholds)
6. Risks and mitigations
7. Ready-to-use prompt templates

## Output Quality Bar

A high-quality output must be:

- Specific: includes concrete steps and examples
- Measurable: every plan has KPIs and checkpoints
- Actionable: user can execute within 24 hours
- Safe: avoids leaking sensitive data, includes governance notes
- Adaptable: includes alternatives for individual vs team setup

## Guardrails

- Never present vague advice without execution detail
- Never claim guaranteed productivity gains; use test-and-measure framing
- Never ignore user constraints (time, policy, tools)
- Prefer incremental rollout over big-bang changes

## Default Templates

### Template A: Agent Specialization Blueprint

- Context: <team/project>
- Problem: <current bottleneck>
- Proposed agents:
  - Agent 1 + scope
  - Agent 2 + scope
  - Agent 3 + scope
  - Agent 4 + scope
- Handoff protocol:
  - Input artifact
  - Output artifact
  - Validation checklist
- Pilot scope: <2 weeks>
- Success metrics: <3 KPIs>

### Template B: Prompt for Technical Task

- Role: You are a <role>
- Objective: <what success looks like>
- Context: <repo/system/business constraints>
- Constraints: <time/security/compatibility>
- Output format: <exact structure>
- Validation: <tests/checks to run>
- Failure mode handling: <what to do if info is missing>

## Completion Checklist

Before finishing, verify:

- Recommendations include quick wins and longer-term system improvements
- At least one measurable KPI per major recommendation
- At least one concrete prompt template user can run immediately
- Risks and mitigations are explicitly listed
