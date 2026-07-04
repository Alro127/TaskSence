# Workflow Guidance Plan (Sync, Versioned)

## Context

- Goal: Use workflow templates but add AI-generated guidance for onboarding.
- Draft workflows have no guidance.
- Guidance is generated only for PUBLIC workflows.
- Guidance generation is synchronous.
- Guidance can be user-edited (summary + step descriptions only) by workflow owner.
- User edits are overwritten on next publish.

## Versioning

- Use workflow `publicationVersion` as the guidance version.
- `publicationVersion` increments only when publishing.
- Guidance is stored per (workflow_id, publication_version).
- Guidance retrieval should use the latest published version.

## Data Model (Proposed)

Table: workflow_guidance

- id (PK)
- workflow_id (FK)
- publication_version (int)
- raw_json (JSONB)
- summary_json (JSONB, optional)
- generated_at (timestamp)
- is_user_edited (bool, default false)
- edited_by (user_id, nullable)

Constraints/Indexes:

- Unique (workflow_id, publication_version)
- Index on workflow_id

## API Endpoints (Proposed)

1. Generate guidance (sync)

- POST /workflows/{workflowId}/guidance/generate
- Only for PUBLIC workflow
- Uses current publicationVersion
- Persist guidance
- Returns guidance payload

2. Get guidance for project

- GET /projects/{projectId}/guidance
- Resolve workflow for projects
- Return latest published guidance
- If missing: return guidance=null with status="MISSING"

3. Update guidance (manual edit)

- PUT /workflows/{workflowId}/guidance
- Only workflow owner
- Allows editing: summary + step descriptions only
- Sets is_user_edited=true, edited_by=currentUser

## Generate Project From Workflow (Pending)

- New endpoint: POST /workflows/{workflowId}/projects
- Workspace logic pending; preferred approach:
  - If workspaceId provided in body, use it
  - Else default to workspace of workflow.project

## Workflow Publish Behavior

- Publish increments publicationVersion
- Publish should NOT fail if AI guidance generation fails
- Guidance can be generated later via /guidance/generate

## Permissions

- Guidance generate/edit endpoints require workflow owner
- Guidance read for project should follow project access rules

## Open Questions

- Workspace resolution final rule for create-project-from-workflow
- Exact guidance JSON schema to store
- AI service endpoint implementation details