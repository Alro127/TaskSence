# Changelog: Project Template & Guidance Feature Implementation

## Implementation Progress Log

### Phase 1: Database & Backend Data Model (Java)
- [x] Created Flyway migration `V16__create_workflow_guidance.sql` to define the `workflow_guidance` table.
- [x] Implement `WorkflowGuidance` entity in `dev.alro127.tasksense.domain.entity`.
- [x] Implement `WorkflowGuidanceRepository` in `dev.alro127.tasksense.repository.jpa`.
- [x] Define DTOs for structured guidance in `dev.alro127.tasksense.dto.guidance`.

### Phase 2: Python AI Service Integration
- [x] Context Builder: Logic to parse workflow template into prompt context (implemented in `guidance_service.py`).
- [x] Generation Prompt: Created specific guidance generation prompt in `ai/app/prompts/guidance.txt`.
- [x] API Endpoint: Exposed `POST /api/v1/guidance/generate` in Python service.

### Phase 3: Java API Endpoints
- [x] Generate Endpoint: `POST /api/v1/workflows/{workflowId}/guidance/generate`.
- [x] Edit Endpoint: `PUT /api/v1/workflows/{workflowId}/guidance`.
- [x] Read Endpoint: `GET /api/v1/projects/{projectId}/guidance` and `GET /api/v1/workflows/{workflowId}/guidance`.
- [x] Project Creation: `POST /api/v1/workflows/{workflowId}/projects` (cloning logic with TODO status reset).

### Phase 4: Frontend - Workflow Management
- [x] Added "Generate Guidance" button to `PublicWorkflowDetailPage`.
- [x] Integrated AI Guidance summary and tips into `PublicWorkflowStepsTab`.
- [x] Added "Use this Template" (Project Creation) flow.

### Phase 5: Frontend - Interactive Guidance Engine
- [x] Implemented `GuidanceProvider` context for state management.
- [x] Implemented `CapabilityRegistry` for semantic UI element mapping.
- [x] Created `<GuidanceTarget />` wrapper component.
- [x] Created `GuidanceOverlay` with Framer Motion for interactive tooltips and highlights.

### Phase 6: Frontend - Project Onboarding Integration
- [x] Integrated onboarding trigger in `ProjectDetailPage`.
- [x] Wrapped "Open Task Board" button as a proof-of-concept guidance target (`CREATE_TASK`).

## Files Modified/Created

### Backend (Java)
- `server/src/main/resources/db/migration/V16__create_workflow_guidance.sql` (NEW)
- `server/src/main/resources/db/migration/V17__add_source_workflow_to_projects.sql` (NEW)
- `server/src/main/java/dev/alro127/tasksense/domain/entity/WorkflowGuidanceEntity.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/domain/entity/ProjectEntity.java` (MODIFIED)
- `server/src/main/java/dev/alro127/tasksense/repository/jpa/WorkflowGuidanceRepository.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/dto/guidance/GuidanceSummaryDto.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/dto/guidance/StepType.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/dto/guidance/StepCompletionConditionDto.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/dto/guidance/GuidanceStepDto.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/dto/guidance/WorkflowGuidanceDto.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/dto/guidance/GuidanceGenerationContextDto.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/dto/request/UpdateWorkflowGuidanceRequest.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/dto/request/CreateProjectFromWorkflowRequest.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/config/common/TaskSenseConfig.java` (MODIFIED)
- `server/src/main/java/dev/alro127/tasksense/client/AiServiceClient.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/service/WorkflowGuidanceService.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/service/impl/WorkflowGuidanceServiceImpl.java` (NEW)
- `server/src/main/java/dev/alro127/tasksense/controller/WorkflowGuidanceController.java` (NEW)

### AI Service (Python)
- `ai/app/prompts/guidance.txt` (NEW)
- `ai/app/service/guidance_service.py` (NEW)
- `ai/app/controller/v1/guidance_controller.py` (NEW)
- `ai/app/controller/v1/__init__.py` (MODIFIED)

### Frontend (React)
- `client/src/types/api.ts` (MODIFIED)
- `client/src/features/workflow/api/workflowApi.ts` (MODIFIED)
- `client/src/features/workflow/pages/PublicWorkflowDetailPage.tsx` (MODIFIED)
- `client/src/features/workflow/components/PublicWorkflowStepsTab.tsx` (MODIFIED)
- `client/src/features/guidance/utils/CapabilityRegistry.ts` (NEW)
- `client/src/features/guidance/context/GuidanceContext.tsx` (NEW)
- `client/src/features/guidance/components/GuidanceTarget.tsx` (NEW)
- `client/src/features/guidance/components/GuidanceOverlay.tsx` (NEW)
- `client/src/App.tsx` (MODIFIED)
- `client/src/layouts/MainLayout.tsx` (MODIFIED)
- `client/src/features/project/pages/ProjectDetailPage.tsx` (MODIFIED)