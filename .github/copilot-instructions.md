# Project Guidelines

## Scope

- These instructions are workspace-wide and apply to all agents operating in this repository.
- For frontend work, treat `client/DESIGN_SYSTEM.md` and `client/PROJECT_CONTEXT.md` as source-of-truth references.

## Code Style

- Keep existing style and naming in each module; do not reformat unrelated code.
- Frontend uses TypeScript + React with path alias imports (`@/`), feature-first layout under `client/src/features`, and shared UI under `client/src/components`.
- Backend uses Java 21 + Spring Boot with package root `dev.alro127.tasksense` and layered organization (`controller`, `service`, `repository`, `dto`, `config`, etc.).
- Prefer small, focused changes. Preserve existing public API shapes unless the task explicitly requires changes.

## Frontend UI System (Mandatory)

- Read `client/DESIGN_SYSTEM.md` before creating or changing frontend UI.
- Prefer existing shadcn/ui components and Tailwind utility classes; do not introduce inline styles.
- Use design tokens and semantic classes (`bg-primary`, `text-muted-foreground`, etc.); avoid hardcoded hex colors in feature components.
- Do not edit generated files under `client/src/components/ui` unless explicitly requested.
- Use `taskStatusConfig` for task status visuals and `taskPriorityConfig` for priority visuals; do not mix them.
- For lists, use Skeleton loading patterns instead of spinner-only placeholders.
- For empty data states, use shared empty-state UI instead of blank screens.

## Architecture

- This workspace is a monorepo with:
  - `client`: React 19 + Vite + Redux Toolkit + RTK Query + shadcn/ui.
  - `server`: Spring Boot application with PostgreSQL, Redis, Elasticsearch, Flyway, and JWT auth.
- Frontend state conventions:
  - Register every RTK Query API slice and middleware in `client/src/app/store.ts`.
  - Authenticated API slices use `prepareHeaders` to inject `Authorization: Bearer <token>` from `auth.accessToken`.
  - On `auth/logout`, the root reducer resets most state and clears RTK Query caches.
- API contract conventions:
  - Backend responses are wrapped as `ApiResponse<T>` with `{ code, message, data }`.
  - Pagination shape is `PageResponse<T>` with `{ data, page, size, totalElements, totalPages }`.
  - Keep frontend types aligned in `client/src/types/api.ts` when backend DTOs change.

## Frontend Conventions

- Use RTK Query for API integration and register every API slice reducer + middleware in `client/src/app/store.ts`.
- Keep route structure consistent with nested workspace/project/task paths in `client/src/routes/index.tsx`.
- Keep route order safe for overlapping paths (for example, static paths before dynamic `:id` routes).
- Keep endpoint intent separation where already established:
  - Use task full update endpoint for full edits.
  - Use task status endpoint only for status transitions.
- Reuse existing feature patterns and component structure from `client/src/features/*` instead of introducing parallel architectures.

## Error Handling and UX Feedback

- For RTK Query mutation error handling in frontend, always bind caught errors and extract backend messages with `getApiErrorMessage(err, fallback)` from `client/src/lib/utils.ts`.
- Do not use empty catch blocks for mutation flows.
- Show server outcome using Sonner toast patterns already used in the codebase.

## Build and Test

- Frontend (`client`):
  - Install: `npm install`
  - Dev server: `npm run dev`
  - Build: `npm run build`
  - Lint: `npm run lint`
  - Note: there is currently no `test` script in `client/package.json`.
- Backend (`server`):
  - Run app: `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`)
  - Test: `./mvnw test` (Windows: `mvnw.cmd test`)
  - Build: `./mvnw clean verify` (Windows: `mvnw.cmd clean verify`)

## Conventions and Pitfalls

- Local backend dependencies are expected on default ports:
  - PostgreSQL `5432`, Redis `6379`, Elasticsearch `9200`.
  - Use `server/compose.yaml` for local infra bootstrap.
- Backend serves under `server.servlet.context-path: /api/v1`; frontend default API base is `http://localhost:8080/api/v1`.
- Flyway migrations live in `server/src/main/resources/db/migration`; seed scripts in `server/src/main/resources/db/seed`.
- Prefer editing source only:
  - Do not modify generated/build outputs such as `client/dist` or `server/target`.
  - Avoid manual edits in dependency folders such as `client/node_modules`.
- Routing patterns use nested workspace/project/task params (see `client/src/routes/index.tsx`). Keep new routes consistent with this structure.
- Notification and comments flow rely on established payload/deeplink patterns in `client/PROJECT_CONTEXT.md`; follow existing conventions rather than inventing new payload assumptions.
- Keep frontend and backend contracts in sync when changing notification, workspace join request, project join request, task, sprint, or comment behavior.

## Key Files

- Frontend store wiring: `client/src/app/store.ts`
- Frontend routes: `client/src/routes/index.tsx`
- Frontend API types: `client/src/types/api.ts`
- Frontend design system: `client/DESIGN_SYSTEM.md`
- Frontend project context: `client/PROJECT_CONTEXT.md`
- Backend config: `server/src/main/resources/application.yaml`
- Backend build config: `server/pom.xml`
- Local infra compose: `server/compose.yaml`
