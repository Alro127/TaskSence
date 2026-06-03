import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type { ApiResponse, PageResponse } from "@/types/api";
import { apiBaseUrl } from "@/config/config";

// ─── Response types ───────────────────────────────────────────────────────────
export interface DashboardSummary {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeProjects: number;
}

export type DashboardProjectStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD" | "ARCHIVED";
export type DashboardTaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type DashboardTaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface DashboardProjectItem {
  id: number;
  workspaceId: number;
  name: string;
  workspaceName: string;
  status: DashboardProjectStatus;
  progress: number;
  taskCount: number;
  overdueCount: number;
  memberCount: number;
  endDate: string | null;
}

export interface DashboardTaskItem {
  id: number;
  title: string;
  projectName: string;
  projectId: number;
  workspaceId: number;
  status: DashboardTaskStatus;
  priority: DashboardTaskPriority;
  dueDate: string | null;
}

export type TaskFilter = "all" | "today" | "overdue";

export type DeadlineType = "TASK" | "SPRINT" | "PROJECT";

export interface DeadlineItem {
  id: number;
  label: string;
  type: DeadlineType;
  date: string;         // LocalDate as "YYYY-MM-DD"
  workspaceId: number;
  projectId: number | null;
}

// ─── API slice ────────────────────────────────────────────────────────────────
export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["DashboardSummary", "DashboardProjects", "DashboardTasks"],
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => "/dashboard/summary",
      transformResponse: (res: ApiResponse<DashboardSummary>) => res.data,
      providesTags: ["DashboardSummary"],
    }),

    getActiveProjects: builder.query<DashboardProjectItem[], void>({
      query: () => "/dashboard/active-projects",
      transformResponse: (res: ApiResponse<DashboardProjectItem[]>) => res.data,
      providesTags: ["DashboardProjects"],
    }),

    getMyTasks: builder.query<
      PageResponse<DashboardTaskItem>,
      { filter?: TaskFilter; page?: number; size?: number }
    >({
      query: ({ filter = "all", page = 0, size = 20 }) =>
        `/dashboard/my-tasks?filter=${filter}&page=${page}&size=${size}`,
      transformResponse: (res: ApiResponse<PageResponse<DashboardTaskItem>>) => res.data,
      providesTags: ["DashboardTasks"],
    }),

    getUpcomingDeadlines: builder.query<DeadlineItem[], { days?: number }>({
      query: ({ days = 7 }) => `/dashboard/upcoming-deadlines?days=${days}`,
      transformResponse: (res: ApiResponse<DeadlineItem[]>) => res.data,
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetActiveProjectsQuery,
  useGetMyTasksQuery,
  useGetUpcomingDeadlinesQuery,
} = dashboardApi;
