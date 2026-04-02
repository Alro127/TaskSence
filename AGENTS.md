# AGENTS.md

Repository guidance for coding agents working in **TaskSense**.

## 1) Repository layout

- Monorepo with two main apps:
  - `client/` → React 19 + Vite + TypeScript + Redux Toolkit/RTK Query
  - `server/` → Spring Boot (Java 21) + JPA + Flyway + PostgreSQL + Redis + Elasticsearch
- Backend base package: `dev.alro127.tasksense`
- Backend context path: `/api/v1` (see `server/src/main/resources/application.yaml`)

## 2) Rule sources (read first)

- Workspace-wide copilot rules exist at:
  - `.github/copilot-instructions.md`
- Frontend source-of-truth docs:
  - `client/DESIGN_SYSTEM.md`
  - `client/PROJECT_CONTEXT.md`
- No `.cursorrules` or `.cursor/rules/` found in this repo at time of writing.

## 3) Build / lint / test commands

### Frontend (`client/`)

- Install dependencies:
  - `npm install`
- Start dev server:
  - `npm run dev`
- Build production bundle:
  - `npm run build`
- Lint whole frontend:
  - `npm run lint`
- Lint a single file/folder:
  - `npm run lint -- src/features/workspace/pages/WorkspacesPage.tsx`

Notes:
- `client/package.json` currently has **no** `test` script.
- Do not invent a test command unless you also add test tooling in a separate task.

### Backend (`server/`)

- Run app:
  - macOS/Linux: `./mvnw spring-boot:run`
  - Windows: `mvnw.cmd spring-boot:run`
- Compile only:
  - macOS/Linux: `./mvnw -DskipTests compile`
  - Windows: `mvnw.cmd -DskipTests compile`
- Run all tests:
  - macOS/Linux: `./mvnw test`
  - Windows: `mvnw.cmd test`
- Full verify build:
  - macOS/Linux: `./mvnw clean verify`
  - Windows: `mvnw.cmd clean verify`

### Run a single backend test (important)

- Single test class:
  - macOS/Linux: `./mvnw -Dtest=TaskSenseApplicationTests test`
  - Windows: `mvnw.cmd -Dtest=TaskSenseApplicationTests test`
- Single test method:
  - macOS/Linux: `./mvnw -Dtest=TaskSenseApplicationTests#contextLoads test`
  - Windows: `mvnw.cmd -Dtest=TaskSenseApplicationTests#contextLoads test`

## 4) Local infrastructure expectations

- Backend expects local services by default:
  - PostgreSQL `localhost:5432`
  - Redis `localhost:6379`
  - Elasticsearch `localhost:9200`
- Use `server/compose.yaml` for local infra bootstrap.
- Frontend default API base is `http://localhost:8080/api/v1`.

## 5) Frontend coding conventions

- Language/tooling:
  - TypeScript strict mode is enabled (`client/tsconfig.app.json`).
  - ESLint uses `typescript-eslint` + React hooks plugins.
- Imports:
  - Prefer alias imports from `@/*` for internal modules.
  - Keep imports grouped (external libs first, then internal aliases, then relative imports if needed).
- Architecture:
  - Follow feature-first structure under `client/src/features/*`.
  - Register every RTK Query API reducer + middleware in `client/src/app/store.ts`.
- Routing:
  - Keep nested route style consistent with existing router in `client/src/routes/index.tsx`.
  - Place static routes before dynamic `:id` routes when overlaps are possible.
- API handling:
  - Backend contracts are wrapped: `ApiResponse<T>` and `PageResponse<T>`.
  - Keep `client/src/types/api.ts` aligned with backend DTO changes.
- Error handling:
  - In mutation catches, always use `getApiErrorMessage(err, fallback)` from `client/src/lib/utils.ts`.
  - Never leave empty `catch {}` blocks.
  - Show outcomes using Sonner toast patterns used in current code.

## 6) Frontend design rules

- Always read and follow `client/DESIGN_SYSTEM.md` before UI work.
- Reuse existing shadcn/ui primitives already used in the codebase.
- Do not edit generated components under `client/src/components/ui` unless explicitly requested.
- Use skeletons for list loading states and explicit empty states for no-data scenarios.

Design-system precedence note:
- `client/DESIGN_SYSTEM.md` explicitly mandates the project palette/classes.
- If any older instruction conflicts with this file, prefer `client/DESIGN_SYSTEM.md` for UI styling decisions.

## 7) Backend coding conventions

- Language/tooling:
  - Java 21, Spring Boot, Lombok widely used.
- Package/layering:
  - Keep standard layering: `controller` → `service` → `repository` → `domain/dto`.
  - Do not bypass service layer from controllers.
- API style:
  - Return `ApiResponse<T>` wrappers from controllers.
  - Use `PageResponse<T>` for paginated endpoints.
- Validation:
  - Use `@Valid` and Jakarta validation annotations on request DTOs.
  - Let `GlobalExceptionHandler` handle validation and API errors consistently.
- Security/authorization:
  - Prefer `@PreAuthorize` with `@perm...` checks for entry-point authorization.
  - Apply resource-level permission checks in service when needed.
- Persistence:
  - Use JPA repositories; keep query methods focused and readable.
  - Keep transactional boundaries in service methods (`@Transactional`).
- Migrations:
  - Put schema changes in `server/src/main/resources/db/migration`.
  - Do not modify old migrations; add new migration files.

## 8) Naming and typing guidance

- Frontend:
  - Components: `PascalCase.tsx`
  - Hooks/utilities/variables: `camelCase`
  - Prefer explicit request/response types for API payloads.
- Backend:
  - Classes/enums: `PascalCase`
  - Methods/fields: `camelCase`
  - DTO suffixes: `*Request`, `*Response`
  - Entity suffix: `*Entity`
  - Repository suffix: `*Repository`

## 9) Formatting and change scope

- Preserve existing style in touched files.
- Do not mass-reformat unrelated files.
- Keep changes minimal and task-focused.
- Avoid renaming/moving files unless required by the task.

## 10) Generated/build artifacts

- Do not edit generated or build output directories:
  - `client/dist`
  - `server/target`
  - `client/node_modules`

## 11) Practical workflow for agents

1. Read relevant rule files (`.github/copilot-instructions.md`, design docs).
2. Inspect existing feature/module patterns before adding new code.
3. Implement smallest coherent change.
4. Run relevant checks:
   - Frontend: `npm run lint` and/or targeted lint command.
   - Backend: `mvnw.cmd -DskipTests compile` and relevant test command.
5. Ensure API contract consistency between backend DTOs and frontend types.

## 12) Current test reality

- Backend test suite currently appears minimal (`TaskSenseApplicationTests` exists).
- Frontend has no configured test script.
- When adding tests, follow existing stack and introduce tooling only if explicitly requested.

## 13) High-risk pitfalls to avoid

- Breaking API wrapper shape expected by frontend (`{ code, message, data, errors? }`).
- Forgetting RTK Query store wiring after adding a new API slice.
- Adding routes in conflicting order causing wrong route matching.
- Styling new UI without checking `client/DESIGN_SYSTEM.md`.
- Editing old Flyway migrations instead of creating new ones.
