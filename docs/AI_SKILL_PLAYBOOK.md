# AI Skill Playbook (No Skill Names Needed)

## Purpose

Help team members use AI effectively without memorizing skill names.

## How to Prompt Normally

Use plain language with goals, constraints, and expected output.
Examples:

- "Help me clarify requirements and create a plan to deploy this feature"
- "Check if this change is safe in terms of packaging and release"
- "Consolidate frontend and backend API after DTO"

Agents will auto-route to relevant skills based on intent.

## Auto-Routing Rules

- Multi-phase delivery request -> agent-execution-workflow
- Clarify scope -> requirements-analysis
- Design architecture -> architecture-design
- API schema sync -> api-contract-sync
- Build/refactor -> feature-implementation
- Test generation -> test-generation
- Review risk gate -> code-review-gate
- Security checks -> security-check
- Release decision -> release-readiness
- Context persistence -> context-doc-sync

## Required Context Behavior

Before planning/implementation, agents should load context docs in order:

1. Documents/ai-context/INDEX.md
2. Latest snapshots in Documents/ai-context/snapshots/
3. Latest 5 run files in Documents/ai-context/runs/
4. Documents/ai-context/LEDGER.md

## Team Prompt Template

- Objective: what outcome is needed
- Context: links to files or modules
- Constraints: time, policy, compatibility
- Done criteria: how to verify output is acceptable

Example:
"Target: add the most capacious API to the task page.
Context: server task controller and client task API.
Rang: keep the current response envelope intact.
Done criteria: compile pass, contract agreement, main test path."

## Governance

- Significant runs must end with context-doc-sync.
- Each run should create or update ai-context docs for continuity.
- If run files grow too much, compact into monthly snapshots.