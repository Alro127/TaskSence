import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  AttachmentResponse,
  CreateAttachmentsRequest,
} from "@/types/api";
import { apiBaseUrl } from "@/config/config";

export const attachmentApi = createApi({
  reducerPath: "attachmentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Attachment"],
  endpoints: (builder) => ({
    /** GET /attachments/task/{taskId} */
    getTaskAttachments: builder.query<ApiResponse<AttachmentResponse[]>, number>({
      query: (taskId) => `/attachments/task/${taskId}`,
      providesTags: (_result, _error, taskId) => [
        { type: "Attachment", id: `TASK_${taskId}` },
      ],
    }),

    /** POST /attachments */
    createAttachments: builder.mutation<
      ApiResponse<AttachmentResponse[]>,
      CreateAttachmentsRequest
    >({
      query: (body) => ({ url: "/attachments", method: "POST", body }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Attachment", id: `TASK_${taskId}` },
      ],
    }),

    /** DELETE /attachments  — body: { attachmentIds } */
    deleteAttachments: builder.mutation<
      ApiResponse<void>,
      { attachmentIds: number[]; taskId: number }
    >({
      query: ({ attachmentIds }) => ({
        url: "/attachments",
        method: "DELETE",
        body: { attachmentIds },
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Attachment", id: `TASK_${taskId}` },
      ],
    }),
  }),
});

export const {
  useGetTaskAttachmentsQuery,
  useCreateAttachmentsMutation,
  useDeleteAttachmentsMutation,
} = attachmentApi;
