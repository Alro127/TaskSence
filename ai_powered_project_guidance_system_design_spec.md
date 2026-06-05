# AI-Powered Project Guidance System

# 1. Overview

## 1.1. Goal

The purpose of this feature is to transform a traditional project template system into an AI-powered workflow onboarding system.

Instead of only generating textual project instructions, the system should:

- analyze project template structure
- generate structured workflow guidance using AI
- provide interactive onboarding directly on the UI
- guide users step-by-step during project creation and execution

The core idea is:

```text
AI generates workflow definition.
Frontend executes the workflow.
```

---

# 2. High-Level Architecture

```text
Project Template
      ↓
Backend Context Builder
      ↓
AI Service
      ↓
Structured Guidance JSON
      ↓
Database
      ↓
Frontend Guidance Engine
      ↓
Interactive User Guidance
```

---

# 3. Core Principles

## 3.1. AI Is Called Only Once

The system must avoid:

```text
Structured data
    ↓
AI → plain text
    ↓
AI → structured onboarding again
```

Instead:

```text
Structured template data
    ↓
AI
    ↓
Structured Guidance JSON
```

AI generates both:

- human-readable guidance
- machine-readable interactive guidance

in a single generation step.

---

## 3.2. AI Does NOT Control UI

AI should NEVER:

- manipulate DOM directly
- know CSS selectors
- know React component structure
- control frontend runtime behavior

AI only generates semantic workflow instructions.

Example:

GOOD:

```json
{
  "action": "CREATE_TASK"
}
```

BAD:

```json
{
  "selector": ".btn-primary:nth-child(2)"
}
```

---

# 4. Guidance Structure

## 4.1. Guidance JSON Format

Example:

```json
{
  "summary": {
    "overview": "...",
    "bestPractices": [],
    "risks": []
  },
  "interactiveSteps": [
    {
      "id": "step_1",
      "title": "Create Authentication Tasks",
      "description": "Create login and register tasks",
      "action": "CREATE_TASK",
      "uiTarget": "CREATE_TASK",
      "type": "REQUIRED",
      "dependsOn": [],
      "completionCondition": {
        "type": "TASK_CREATED",
        "count": 2
      }
    }
  ]
}
```

---

## 4.2. Step Types

Each step may be:

| Type | Meaning |
|---|---|
| REQUIRED | Cannot skip |
| OPTIONAL | User can skip |
| CONDITIONAL | Appears only when conditions are met |

---

## 4.3. Step Constraints

Steps may depend on previous steps.

Example:

```json
{
  "dependsOn": ["step_1"]
}
```

This creates a lightweight workflow graph.

---

# 5. Backend Design

# 5.1. Generate Guidance Flow

## Step 1 — User Requests Guidance Generation

User selects:

```text
Generate Guidance
```

---

## Step 2 — Backend Collects Template Context

Backend collects:

- project template info
- sprint structure
- tasks
- priorities
- metadata
- supported features

---

## Step 3 — Context Builder

The backend transforms domain data into AI-friendly structured context.

Example:

```json
{
  "projectName": "Task Management App",
  "availableActions": [
    "CREATE_TASK",
    "CREATE_SPRINT",
    "MOVE_TASK"
  ]
}
```

---

## Step 4 — AI Generates Structured Guidance

AI generates:

- overview
- execution plan
- onboarding workflow
- best practices
- risks
- interactive steps

---

## Step 5 — Validation Layer

Backend validates:

- malformed JSON
- unsupported actions
- invalid constraints
- duplicated steps
- unsupported capabilities

---

## Step 6 — Save Guidance

Store:

- guidance summary
- raw structured JSON
- generated metadata
- content hash

---

# 5.2. Guidance Caching

## Problem

AI generation is expensive.

Repeated generation for identical templates should be avoided.

---

## Solution: Content Hash Cache

Generate deterministic hash from template structure.

Example:

```text
SHA256(template_content)
```

Flow:

```text
Generate request
      ↓
Compute template hash
      ↓
Check DB
      ↓
Guidance exists?
      ↓
YES → reuse
NO → generate with AI
```

---

## Suggested DB Fields

| Field | Description |
|---|---|
| template_hash | unique template content hash |
| ai_model | model used |
| raw_json | structured guidance |
| generated_at | timestamp |

---

# 6. Frontend Guidance Engine

# 6.1. Responsibility

The Guidance Engine is implemented on the frontend.

Responsibilities:

- load guidance steps
- track current step
- highlight UI elements
- render onboarding instructions
- manage step transitions
- detect completion

The Guidance Engine does NOT:

- generate AI content
- call AI runtime
- manipulate arbitrary DOM
- autonomously control the application

---

# 6.2. FE Architecture

```text
App
 └── GuidanceProvider
       ├── CapabilityRegistry
       ├── GuidanceOverlay
       └── GuidanceController
```

---

# 6.3. Capability Registry

The frontend must expose semantic UI capabilities.

Example:

```ts
const capabilities = {
   CREATE_TASK: {
      ref: taskCreateButtonRef,
      route: "/tasks"
   }
}
```

This avoids hardcoded DOM selectors.

---

# 6.4. GuidanceTarget Wrapper

UI components register themselves.

Example:

```tsx
<GuidanceTarget capability="CREATE_TASK">
   <Button>Create Task</Button>
</GuidanceTarget>
```

Internally:

```ts
registerCapability(capability, ref)
```

---

# 6.5. Runtime Flow

## Step 1 — Load Current Step

Example:

```json
{
  "action": "CREATE_TASK"
}
```

---

## Step 2 — Resolve Capability

```ts
const target = registry.get("CREATE_TASK")
```

---

## Step 3 — Render Guidance UI

Possible UI behaviors:

- tooltip
- spotlight overlay
- auto scroll
- sidebar instructions
- subtle highlighting

Example:

```text
Click here to create your first task
```

---

## Step 4 — Detect Completion

Two mechanisms:

### Manual Completion

User clicks:

```text
Next Step
```

### Event-Driven Completion

Frontend emits semantic events.

Example:

```ts
eventBus.emit("TASK_CREATED")
```

Guidance Engine listens:

```ts
eventBus.on("TASK_CREATED")
```

---

## Step 5 — Transition To Next Step

```ts
currentStep++
```

---

# 7. UX Direction

The onboarding experience should remain lightweight.

Guidelines:

- minimal animations
- avoid excessive tooltips
- avoid UI overload
- allow optional step skipping
- preserve workflow constraints
- support progressive onboarding

---

# 8. Adaptive Guidance (Planned Feature)

Adaptive guidance is included in the roadmap.

However:

- NO realtime autonomous AI
- NO runtime AI replanning
- NO AI observing user screen

Instead:

- AI pre-generates conditional workflow branches
- frontend selects proper branch at runtime

Example:

```json
{
  "condition": {
    "teamSize": ">5"
  }
}
```

---

# 9. Pain Points & Solutions

# 9.1. AI Hallucination

## Problem

AI may generate:

- unsupported actions
- impossible workflows
- invalid capabilities

## Solution

Use constraint-based prompting.

Example:

```json
{
  "availableActions": [
    "CREATE_TASK",
    "CREATE_SPRINT"
  ]
}
```

---

# 9.2. UI Changes

## Problem

Frontend UI evolves over time.

## Solution

Use semantic capability abstraction instead of DOM selectors.

Example:

```text
CREATE_TASK
```

Frontend runtime resolves actual UI element dynamically.

---

# 9.3. UX Complexity

## Problem

Too many overlays/tooltips create poor UX.

## Solution

- keep onboarding minimal
- support skipping
- use lightweight visual guidance
- avoid interrupting workflow

---

# 9.4. AI Cost

## Problem

Repeated AI generation increases cost.

## Solution

Use content hash caching.

---

# 10. Recommended Scope

# 10.1. Recommended For Initial Implementation

Backend:

- structured guidance generation
- validation layer
- content hash caching
- workflow constraints

Frontend:

- Guidance Engine
- capability registry
- tooltip onboarding
- step transitions
- manual completion
- optional event-driven completion

---

# 10.2. Avoid Over-Engineering

Do NOT implement:

- autonomous AI runtime
- AI-controlled UI
- dynamic DOM parsing
- self-healing AI guidance
- realtime AI orchestration

---

# 11. Core Product Insight

This system is NOT:

```text
AI text generation feature
```

This system IS:

```text
AI-powered workflow onboarding and execution guidance system
```

