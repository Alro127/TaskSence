---
description: Sync a significant TaskSense AI/code run into docs/ai-context for durable handoff context.
---

## User Input

```text
$ARGUMENTS
```

## Goal

Maintain durable AI context after significant work by updating local project docs.

## Required Read Order

1. `docs/ai-context/INDEX.md`
2. Latest snapshot in `docs/ai-context/snapshots/` if present
3. Latest 5 run files in `docs/ai-context/runs/`
4. `docs/ai-context/LEDGER.md`
5. `docs/ai-context/runs/RUN-TEMPLATE.md`

## Workflow

1. Create a new run file `docs/ai-context/runs/RUN-YYYY-MM-DD-###.md` using the next sequence number for the day.
2. Capture:
   - Run trigger and request summary
   - Primary skills/commands used
   - Key files reviewed/touched
   - Assumptions, constraints, plan, and validation
   - Work completed and commands/tests run
   - Quality/security/release status
   - Follow-ups and remaining issues
3. Promote only durable decisions, constraints, and risks to `docs/ai-context/LEDGER.md`.
4. Add/update the Recent Runs row in `docs/ai-context/INDEX.md`.
5. Check compaction threshold: more than 30 run files or about 12,000 total run lines.
6. Validate no contradictions between the new run, index, and ledger.

## Output Format

1. Context read status
2. Run file creation status
3. Stable context updates
4. Index/risk/decision updates
5. Compaction status
6. Sync quality check result

## Guardrails

- Never overwrite historical run entries.
- Never store secrets, tokens, passwords, or private keys.
- Do not promote transient implementation noise to the ledger.
- Do not claim sync success without listing exact files updated.
