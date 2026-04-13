# AI Skill Playbook (No Skill Names Needed)

## Purpose

Help team members use AI effectively without memorizing skill names.

## How to Prompt Normally

Use plain language with goal, constraints, and expected output.
Examples:

- "Giup minh lam ro yeu cau va lap ke hoach trien khai feature nay"
- "Kiem tra thay doi nay co an toan ve bao mat va release duoc chua"
- "Dong bo API frontend va backend sau khi doi DTO"

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
2. Latest snapshot in Documents/ai-context/snapshots/
3. Latest 5 run files in Documents/ai-context/runs/
4. Documents/ai-context/LEDGER.md

## Team Prompt Template

- Objective: what outcome is needed
- Context: links to files or modules
- Constraints: time, policy, compatibility
- Done criteria: how to verify output is acceptable

Example:
"Muc tieu: them API cap nhat trang thai task.
Context: server task controller va client task API.
Rang buoc: giu nguyen response envelope hien tai.
Done criteria: compile pass, contract dong bo, co test path chinh."

## Governance

- Significant runs must end with context-doc-sync.
- Each run should create or update ai-context docs for continuity.
- If run files grow too much, compact into monthly snapshots.
