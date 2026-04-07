---
name: context-doc-sync
description: "Use when the user wants to preserve context consistency across AI runs by maintaining structured project memory docs and syncing them after each run. Triggers include: context doc, session memory, run log, knowledge continuity, decision log, and AI handoff documentation."
---

# Context Doc Sync

## Goal

Maintain consistent, durable context across AI runs by updating structured multi-file context documents after each significant AI execution:

- Documents/ai-context/INDEX.md
- Documents/ai-context/LEDGER.md
- Documents/ai-context/runs/RUN-YYYY-MM-DD-###.md
- Documents/ai-context/snapshots/SNAPSHOT-YYYY-MM.md (when compacting)

## When to Use

Use this skill when the user asks for:

- Context persistence between AI sessions
- Run-by-run documentation and handoff
- Decision tracking and continuity
- Stable project memory and reduced re-explaining

Do not use this skill for:

- Pure coding requests that explicitly skip documentation
- Harmful or policy-violating content

## Inputs to Collect

1. Run trigger and request summary
2. Skills/agents used in the run
3. Files touched and verification performed
4. Assumptions and unresolved unknowns
5. Risks and next actions

If critical inputs are missing, proceed with explicit placeholders and mark them as "to verify".

## Workflow

1. Load context before work

- Read documents in strict order:
  1. Documents/ai-context/INDEX.md
  2. Latest file in Documents/ai-context/snapshots/
  3. Latest 5 files in Documents/ai-context/runs/
  4. Documents/ai-context/LEDGER.md

2. Capture run summary

- Create one dedicated run file in Documents/ai-context/runs/ using RUN-TEMPLATE.md and naming RUN-YYYY-MM-DD-###.md.

3. Extract stable knowledge

- Promote durable facts from the run into Documents/ai-context/LEDGER.md.
- Keep only long-lived context (conventions, constraints, decisions, risks, recent impactful changes).

4. Update index and continuity

- Update Documents/ai-context/INDEX.md with:
  - Recent Runs row
  - Open Decisions updates
  - Active Constraints updates
  - Risk Register updates

5. Compact when threshold is reached

- If run files exceed threshold (more than 30 files or about 12,000 lines total), create/update monthly snapshot in Documents/ai-context/snapshots/ and trim index references to focus on recent runs plus snapshot.

6. Validate sync quality

- Confirm no contradiction between run file, INDEX, and LEDGER.
- Confirm every major run has a corresponding dedicated run file.

## Required Output Format

1. Context read status
2. Run file creation status
3. Stable context updates
4. Index and risk/decision updates
5. Compaction status
6. Sync quality check result

## Output Quality Bar

A high-quality output must be:

- Specific: includes concrete updates, not generic notes
- Consistent: no conflict with existing documented facts
- Durable: only long-term facts go to ledger
- Traceable: each important update maps to a dedicated run file
- Actionable: includes clear next actions with priority

## Guardrails

- Never overwrite historical entries; append or update with clear timestamps
- Never store secrets, tokens, passwords, or private keys
- Never copy transient noise into ledger (temporary hypotheses, unstable logs)
- Never skip INDEX update after creating a run file
- Never skip compaction check when run volume threshold is reached
- Never claim sync success without listing what was updated

## Default Templates

### Template A: Run Entry (Dedicated Run File)

- Run ID: RUN-YYYY-MM-DD-###
- Date: <YYYY-MM-DD>
- Trigger: <user request>
- Request Summary: <short summary>
- Primary Skill(s): <skills used>
- Agent Role(s): <roles used>
- Inputs Snapshot:
  - Key files reviewed: <list>
  - Constraints detected: <list>
  - Assumptions made: <list>
- Plan and Validation:
  - Planning approach: <summary>
  - Plan reviewer findings: <summary>
  - Design compliance checks: <summary>
- Work Completed:
  - Changes made: <list>
  - Files touched: <list>
  - Commands/tests run: <list>
- Quality and Security:
  - Requirement compliance result: <pass/fail>
  - Plan compliance result: <pass/fail>
  - Security check result: <pass/fail>
  - Release readiness result: <go/no-go>
- Follow-ups:
  - Remaining issues: <list>
  - Next actions: <list>
  - Context promoted to ledger: <list>

### Template B: Index Update

- Recent Runs row added: <run id, summary, files>
- Open Decision added/updated: <decision item>
- Active Constraint added/updated: <constraint>
- Risk Register added/updated: <risk and mitigation>

### Template C: Compaction Snapshot

- Source range: <run ids included>
- Major completed work: <list>
- Durable decisions and constraints: <list>
- Remaining open risks: <list>
- Next-run startup guidance: <list>

## Completion Checklist

Before finishing, verify:

- Required context docs were read in protocol order
- A dedicated run file is created in Documents/ai-context/runs/
- Durable updates are synced to Documents/ai-context/LEDGER.md
- INDEX decisions, constraints, and risks are updated if impacted
- Compaction threshold check has been performed
- No sensitive data is written
