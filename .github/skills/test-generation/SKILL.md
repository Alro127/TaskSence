---
name: test-generation
description: "Use when the user needs test cases generated or improved for new or changed software behavior, including unit, integration, and edge-case scenarios with clear pass/fail criteria. Triggers include: add tests, increase coverage, regression prevention, edge-case testing, and acceptance test mapping."
---

# Test Generation

## Goal

Generate high-signal tests that verify expected behavior and prevent regressions.

## When to Use

Use this skill when the user asks for:

- Unit or integration test creation
- Coverage improvement
- Regression test additions
- Edge-case and error-path validation

Do not use this skill for:

- Non-test implementation tasks
- Security exploit or harmful requests

## Inputs to Collect

1. Changed behavior and acceptance criteria
2. Existing test framework and style
3. Critical paths and edge cases
4. Mocking and dependency constraints
5. Performance/time constraints for test suite

## Workflow

1. Derive test scenarios from acceptance criteria.
2. Prioritize critical and regression-prone paths.
3. Generate deterministic tests with clear assertions.
4. Add negative and edge-case coverage.
5. Summarize coverage and remaining gaps.

## Required Output Format

1. Test strategy summary
2. Scenario matrix (happy/edge/error)
3. Proposed tests by level (unit/integration)
4. Assertion focus and expected outcomes
5. Gaps and deferred tests

## Quality Bar

- Every critical criterion has at least one test
- Assertions are behavior-focused
- Edge and failure paths are covered
- Flaky patterns are avoided

## Guardrails

- Never generate tests without expected outcomes
- Never overuse brittle implementation-detail assertions
- Never ignore negative scenarios

## Completion Checklist

- Scenario matrix completed
- Critical and regression paths covered
- Remaining gaps explicitly listed
