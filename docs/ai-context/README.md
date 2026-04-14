# AI Context Documents

## Purpose

Structured long-term context for multi-agent workflows.

## Folder Structure

- runs/: One file per completed AI run.
- snapshots/: Compacted summaries when run files become too many.
- INDEX.md: Canonical index that agents must read first.
- LEDGER.md: Durable facts and decisions.

## Rules

1. Each completed run creates one file in runs/.
2. INDEX.md must be updated after every run.
3. LEDGER.md stores only durable context.
4. If run files exceed threshold, compact into snapshots and archive older details.

## Naming Conventions

- run files: RUN-YYYY-MM-DD-###.md
- snapshot files: SNAPSHOT-YYYY-MM.md

## Compaction Trigger

Trigger compaction when either condition is met:

- runs/ contains more than 30 files, or
- cumulative run content in runs/ is estimated above 12,000 lines.

## Agent Read Order

1. INDEX.md
2. Latest snapshot in snapshots/ (if present)
3. Last 5 run files in runs/
4. LEDGER.md
