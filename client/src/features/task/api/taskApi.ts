import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  PageResponse,
  TaskResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  TaskSearchParams,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const taskApi = createApi({
  reducerPath: "taskApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Task"],
  endpoints: (builder) => ({
    getTasksByProject: builder.query<
      ApiResponse<PageResponse<TaskResponse>>,
      { projectId: number; page?: number; size?: number; sort?: string }
    >({
      query: ({ projectId, page = 0, size = 20, sort }) => ({
        url: `/projects/${projectId}/tasks`,
        params: { page, size, ...(sort ? { sort } : {}) },
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: "Task", id: `PROJECT_${projectId}` },
      ],
    }),

    searchTasks: builder.query<
      ApiResponse<TaskResponse[]>,
      { projectId: number } & TaskSearchParams
    >({
      query: ({ projectId, ...params }) => ({
        url: `/projects/${projectId}/tasks/search`,
        params,
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: "Task", id: `PROJECT_${projectId}` },
      ],
    }),

    getTaskById: builder.query<
      ApiResponse<TaskResponse>,
      { projectId: number; taskId: number }
    >({
      query: ({ projectId, taskId }) =>
        `/projects/${projectId}/tasks/${taskId}`,
      providesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),

    getSubTasks: builder.query<
      ApiResponse<PageResponse<TaskResponse>>,
      { projectId: number; taskId: number; page?: number; size?: number }
    >({
      query: ({ projectId, taskId, page = 0, size = 50 }) => ({
        url: `/projects/${projectId}/tasks/${taskId}/subtasks`,
        params: { page, size },
      }),
      providesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: `SUBTASKS_${taskId}` },
      ],
    }),

    createTask: builder.mutation<
      ApiResponse<TaskResponse>,
      { projectId: number } & CreateTaskRequest
    >({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId, parentTaskId }) => [
        { type: "Task", id: `PROJECT_${projectId}` },
        ...(parentTaskId != null
          ? [{ type: "Task" as const, id: `SUBTASKS_${parentTaskId}` }]
          : []),
      ],
    }),

    updateTask: builder.mutation<
      ApiResponse<TaskResponse>,
      { projectId: number; taskId: number; _parentTaskId?: number } & UpdateTaskRequest
    >({
      query: ({ projectId, taskId, _parentTaskId, ...body }) => ({
        url: `/projects/${projectId}/tasks/${taskId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId, taskId, _parentTaskId }) => [
        { type: "Task", id: taskId },
        { type: "Task", id: `PROJECT_${projectId}` },
        { type: "Task", id: `SUBTASKS_${taskId}` },
        ...(_parentTaskId != null
          ? [{ type: "Task" as const, id: `SUBTASKS_${_parentTaskId}` }]
          : []),
      ],
    }),

    updateTaskStatus: builder.mutation<
      ApiResponse<TaskResponse>,
      { projectId: number; taskId: number; _parentTaskId?: number } & UpdateTaskStatusRequest
    >({
      query: ({ projectId, taskId, _parentTaskId, ...body }) => ({
        url: `/projects/${projectId}/tasks/${taskId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId, taskId, _parentTaskId }) => [
        { type: "Task", id: taskId },
        { type: "Task", id: `PROJECT_${projectId}` },
        ...(_parentTaskId != null
          ? [{ type: "Task" as const, id: `SUBTASKS_${_parentTaskId}` }]
          : []),
      ],
    }),

    deleteTask: builder.mutation<
      ApiResponse<void>,
      { projectId: number; taskId: number }
    >({
      query: ({ projectId, taskId }) => ({
        url: `/projects/${projectId}/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId, taskId }) => [
        { type: "Task", id: `PROJECT_${projectId}` },
        { type: "Task", id: taskId },
      ],
    }),
  }),
});

export const {
  useGetTasksByProjectQuery,
  useSearchTasksQuery,
  useGetTaskByIdQuery,
  useGetSubTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} = taskApi;
