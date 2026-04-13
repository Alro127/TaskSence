# AI Workflow Refinement – Handoff Summary (Phase 1)

## 1) Final agreed scope

Implement **AI suggestion features** for workflow drafts:

1. **Suggest missing step**
2. **Generate explanation for each step**
3. **Suggest reorder of existing steps**

These are agreed as the first implementation phase.

---

## 2) Why this scope is good

- High user value with low operational risk.
- Improves workflow quality and clarity without risky automatic structural edits.
- Easy to review in UI (suggestion-based flow).
- Compatible with current backend state (rule-based draft generation already exists).

---

## 3) Explicitly out of scope (for this phase)

- **No merge step**
- **No split step**
- **No auto-apply** of structural changes
- **No mutation** of workflow steps from AI suggestions endpoint

Any structural change remains suggestion-only and must be user-approved in future phases.

---

## 4) Current codebase anchors

- Rule-based generation:
  - `server/src/main/java/dev/alro127/tasksense/service/impl/WorkflowServiceImpl.java`
  - method: `createWorkflowFromProject(Long projectId, CreateWorkflowFromProjectRequest request)`
- Workflow creation endpoint:
  - `server/src/main/java/dev/alro127/tasksense/controller/WorkflowController.java`
  - `POST /projects/{projectId}/workflows/drafts/from-project`
- Existing request flag:
  - `server/src/main/java/dev/alro127/tasksense/dto/request/CreateWorkflowFromProjectRequest.java`
  - `useAiRefinement`
- Existing workflow metadata:
  - `server/src/main/java/dev/alro127/tasksense/domain/entity/WorkflowEntity.java`
  - fields: `generationSource`, `aiRefinementRequested`

---

## 5) Product/behavior decisions

1. Keep existing draft creation behavior unchanged (rule-based remains primary).
2. AI output in this phase is **read-only suggestions**.
3. Explanations can be generated automatically as suggestion content.
4. Missing-step and reorder are recommendation-only (not persisted as edits).
5. If AI fails or output is invalid: return empty/partial-safe suggestions, never break workflow draft data.

---

## 6) Suggested API design for implementation AI

### Existing endpoint (unchanged)
- `POST /projects/{projectId}/workflows/drafts/from-project`

### New endpoint (suggestions only)
- `POST /projects/{projectId}/workflows/drafts/{workflowId}/ai-suggestions`

Suggested request:

```json
{
  "types": ["MISSING_STEP", "STEP_EXPLANATION", "REORDER_PROPOSAL"],
  "maxMissingSteps": 2,
  "includeTaskContext": true
}
```

Suggested response (shape):

```json
{
  "workflowId": 42,
  "suggestionOnly": true,
  "suggestions": {
    "stepExplanations": [
      { "stepId": 101, "explanation": "...", "confidence": 0.88 }
    ],
    "missingSteps": [
      {
        "tempId": "ms-1",
        "title": "Release Readiness",
        "description": "...",
        "insertAfterStepId": 103,
        "rationale": "...",
        "confidence": 0.79
      }
    ],
    "reorderProposal": {
      "proposedOrder": [
        { "stepId": 101, "newPosition": 1, "reason": "..." }
      ],
      "rationale": "...",
      "confidence": 0.74
    }
  }
}
```

---

## 7) Backend architecture suggestion (phase-appropriate)

Create:
- `WorkflowAiSuggestionController`
- `WorkflowAiSuggestionService` + `WorkflowAiSuggestionServiceImpl`
- `WorkflowAiPromptBuilder`
- `AiWorkflowSuggestionClient` (provider adapter)
- `WorkflowAiSuggestionValidator`
- DTOs for request/response/suggestion types

Principles:
- No repository writes in suggestion endpoint.
- Keep generation source unchanged (`RULE_BASED`) in this phase.
- Respect existing authorization model from workflow/project endpoints.

---

## 8) Validation & safety rules (must-have)

- Reorder proposal must reference existing `stepId`s only.
- `newPosition` values must be a valid contiguous permutation.
- Missing-step count must be capped (e.g., <= 3).
- Explanation mapped to valid existing steps.
- Strip/reject forbidden suggestion types (merge/split).
- Timeout + graceful fallback for AI provider failures.
- Never mutate workflow data from suggestion generation.

---

## 9) MVP acceptance criteria

1. Existing draft creation endpoint still behaves the same.
2. New AI suggestions endpoint returns structured suggestions for:
   - missing steps,
   - step explanations,
   - reorder proposal.
3. Suggestion endpoint performs **zero DB mutation**.
4. Invalid AI output is safely rejected/sanitized.
5. Merge/split suggestions do not appear in API response.

---

## 10) Future phases (not now)

- User-approved apply endpoint for accepted suggestions.
- Audit/version history for accepted/rejected AI suggestions.
- Merge/split proposals once validation and UX controls are mature.
