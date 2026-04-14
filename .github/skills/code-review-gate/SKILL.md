---
name: code-review-gate
description: "Use when the user needs a strict code review gate focused on bug risk, regressions, security, maintainability, and missing tests before merge. Triggers include: review PR, quality gate, pre-merge check, defect triage, and severity-based findings."
---

# Code Review Gate

## Goal

Block risky changes before merge by surfacing severity-ranked findings and required fixes.

## When to Use

Use this skill when the user asks for:

- Pre-merge review
- Risk-focused code audit
- Regression and maintainability checks
- Missing test detection

Do not use this skill for:

- Feature brainstorming without code context
- Security exploit or harmful requests

## Inputs to Collect

1. Change scope and modified files
2. Intended behavior changes
3. Existing tests and CI signals
4. Coding standards and project conventions
5. Known risk areas in module

## Workflow

1. Assess correctness and behavior impact.
2. Detect regression and edge-case risks.
3. Evaluate security and data handling.
4. Check maintainability and readability issues.
5. Report findings by severity and fix priority.

## Required Output Format

1. Critical findings
2. Major findings
3. Minor findings
4. Missing tests and suggested additions
5. Merge recommendation (pass/block)

## Quality Bar

- Findings are evidence-based and specific
- Severity mapping is consistent
- Recommendations are actionable
- False positives are minimized

## Guardrails

- Never approve with unresolved critical issues
- Never report style-only notes as major defects
- Never omit missing test coverage when behavior changed

## Completion Checklist

- Severity-ranked findings included
- Test gaps documented
- Clear pass/block recommendation provided
