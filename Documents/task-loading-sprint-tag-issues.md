# Task Loading Issues Around Sprint And Tag

Date: 2026-03-16

## Context

The project recently introduced sprint and tag features that can navigate users into the task screen with query params such as:

- `?sprint=<id>`
- `?tags=<id>`

At the moment, the task Kanban and list screens do not fully support this flow. This document records the current issues and the recommended follow-up work.

## Main Problems

### 1. Task page does not consume sprint or tag query params

The task page can be opened from sprint and tag-related actions, but `TaskBoardPage` does not currently read `searchParams` and does not initialize any filter state from the URL.

Impact:

- User clicks a sprint card and lands on the task page, but the page still shows all tasks.
- User clicks a tag from task detail and lands on the task page, but the page is not filtered by that tag.
- URL and UI state are inconsistent.

Relevant code:

- `client/src/features/project/components/SprintManagementTab.tsx`
- `client/src/features/task/pages/TaskDetailPage.tsx`
- `client/src/features/task/pages/TaskBoardPage.tsx`

### 2. Frontend search contract does not support sprint or tag filters

`TaskSearchParams` currently supports:

- `status`
- `priority`
- `assigneeId`
- `keyword`
- `dueDateFrom`
- `dueDateTo`
- `page`
- `size`

It does not support:

- `sprintId`
- `tagIds`

Impact:

- Frontend has no typed way to request task search by sprint.
- Frontend has no typed way to request task search by one or more tags.
- Any later implementation will likely become ad hoc unless the contract is updated first.

Relevant code:

- `client/src/types/api.ts`
- `client/src/features/task/api/taskApi.ts`

### 3. Backend search endpoint does not support sprint or tag filters yet

The current `/projects/{projectId}/tasks/search` endpoint only supports:

- `status`
- `priority`
- `assigneeId`
- `keyword`
- `dueDateFrom`
- `dueDateTo`
- `page`
- `size`

There is no backend support yet for:

- `sprintId`
- `tagIds`

Impact:

- Even if the frontend reads `?sprint=` or `?tags=`, the search result still cannot be filtered correctly.
- Fixing only the UI will create the appearance of support without correct data behavior.

Relevant code:

- `server/src/main/java/dev/alro127/tasksense/controller/TaskController.java`
- `server/src/main/java/dev/alro127/tasksense/service/TaskService.java`
- `server/src/main/java/dev/alro127/tasksense/service/impl/TaskServiceImpl.java`
- `server/src/main/java/dev/alro127/tasksense/repository/jpa/TaskRepository.java`

### 4. List view pagination is not truly paginated

The current search endpoint returns `List<TaskResponse>`, not `PageResponse<TaskResponse>`.

The list screen currently calculates:

- total items from `listTasksData?.data?.length`
- total pages from local array length

Impact:

- Pagination UI is not backed by real total counts from the server.
- `Showing x-y of z tasks` can be misleading.
- This gets worse when additional sprint/tag filters are introduced.

Relevant code:

- `client/src/features/task/api/taskApi.ts`
- `client/src/features/task/pages/TaskBoardPage.tsx`

### 5. Kanban board currently relies on a hard fetch cap

Board mode calls search with `size: 200` so that all columns can be rendered client-side for drag and drop.

Impact:

- Projects with more than 200 matching tasks will not render fully on the board.
- Sprint or tag filters may appear to work but still silently truncate results.
- The current board loading model does not scale well.

Relevant code:

- `client/src/features/task/pages/TaskBoardPage.tsx`

### 6. Need to define tag filter semantics before implementing

If multiple tags are supported in the future, behavior is still undefined.

Open question:

- Should `tagIds=1,2,3` mean tasks matching `ANY` selected tag?
- Or should it mean tasks matching `ALL` selected tags?

Recommendation:

- Default to `ANY` for board/list filtering unless there is a clear product requirement for `ALL`.

### 7. Need to confirm whether root tasks only should be shown

The task board and list currently filter out subtasks on the frontend.

Impact:

- If sprint/tag filtering is added later, expected counts may differ from what users think they are searching.
- The product rule should be explicit: root tasks only, or root tasks plus subtasks.

Relevant code:

- `client/src/features/task/pages/TaskBoardPage.tsx`

## Recommended Follow-up Order

### Phase 1. Fix the contract

Update task search contract across frontend and backend to support:

- `sprintId`
- `tagIds`

Also consider changing the search response to paginated format:

- `ApiResponse<PageResponse<TaskResponse>>`

### Phase 2. Sync URL and UI state

Update `TaskBoardPage` to:

- read `useSearchParams()`
- initialize filters from `sprint` and `tags`
- keep the visible filter state aligned with the URL

### Phase 3. Fix list pagination properly

Move list view to server-backed pagination using actual totals from the API.

### Phase 4. Revisit Kanban loading strategy

Short term:

- allow board filtering by sprint/tag using the improved search API

Long term:

- redesign Kanban loading so it does not depend on fetching a capped task set in one request

## Suggested API Shape For Later

Query params:

- `status`
- `priority`
- `assigneeId`
- `keyword`
- `dueDateFrom`
- `dueDateTo`
- `sprintId`
- `tagIds`
- `page`
- `size`

Suggested response:

- `ApiResponse<PageResponse<TaskResponse>>`

## Summary

This is not only a UI filtering problem.

The root issue is that sprint and tag navigation already exists, but the task search contract and the task page loading model have not been updated to support those new contexts.

If this is fixed later, the safest order is:

1. Update backend search support.
2. Update frontend types and RTK Query contract.
3. Sync URL params into task page filters.
4. Replace fake list pagination with real server pagination.
5. Rework Kanban loading if the current fetch cap becomes a problem.
