import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useGetDocumentPresignUrlMutation } from "@/features/user/api/userApi";
import { useCreateAttachmentsMutation } from "../api/attachmentApi";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
]);

export interface PendingFile {
  uid: string;
  file: File;
  /** Object URL — only set for valid image files */
  previewUrl: string | null;
  /** Validation error message, if any */
  error?: string;
}

interface UseAttachmentUploadReturn {
  pendingFiles: PendingFile[];
  isUploading: boolean;
  addFiles: (files: FileList | File[]) => void;
  removePending: (uid: string) => void;
  clearPending: () => void;
  uploadAll: (taskId: number) => Promise<void>;
}

export function useAttachmentUpload(): UseAttachmentUploadReturn {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [getDocumentPresignUrl] = useGetDocumentPresignUrlMutation();
  const [createAttachments] = useCreateAttachmentsMutation();

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newPending: PendingFile[] = fileArray.map((file) => {
      let error: string | undefined;
      if (file.size > MAX_FILE_SIZE) {
        error = "File quá lớn (tối đa 50MB)";
      } else if (!ALLOWED_MIME_TYPES.has(file.type)) {
        error = "Định dạng không được hỗ trợ";
      }
      return {
        uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl:
          file.type.startsWith("image/") && !error
            ? URL.createObjectURL(file)
            : null,
        error,
      };
    });
    setPendingFiles((prev) => [...prev, ...newPending]);
  }, []);

  const removePending = useCallback((uid: string) => {
    setPendingFiles((prev) => {
      const item = prev.find((p) => p.uid === uid);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.uid !== uid);
    });
  }, []);

  const clearPending = useCallback(() => {
    setPendingFiles((prev) => {
      prev.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      return [];
    });
  }, []);

  const uploadAll = useCallback(
    async (taskId: number) => {
      const validFiles = pendingFiles.filter((p) => !p.error);
      if (validFiles.length === 0) return;

      setIsUploading(true);
      try {
        const uploadedFiles: {
          fileUrl: string;
          fileType: string;
          fileSize: number;
        }[] = [];

        for (const pending of validFiles) {
          const { file } = pending;
          const parts = file.name.split(".");
          const extension = "." + parts.pop();
          const fileName = parts.join(".");

          // 1. Get presigned URL from backend
          const presignRes = await getDocumentPresignUrl({
            fileName,
            extension,
          }).unwrap();
          const { uploadUrl, fileUrl } = presignRes.data;

          // 2. Upload directly to S3
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          if (!uploadRes.ok) {
            throw new Error(`Không thể upload "${file.name}"`);
          }

          uploadedFiles.push({
            fileUrl,
            fileType: file.type,
            fileSize: file.size,
          });
        }

        // 3. Save metadata to DB
        await createAttachments({ taskId, files: uploadedFiles }).unwrap();

        toast.success(
          `Đã upload ${validFiles.length} file${validFiles.length > 1 ? "s" : ""}`,
        );
        clearPending();
      } catch {
        toast.error("Upload thất bại. Vui lòng thử lại.");
      } finally {
        setIsUploading(false);
      }
    },
    [pendingFiles, getDocumentPresignUrl, createAttachments, clearPending],
  );

  return {
    pendingFiles,
    isUploading,
    addFiles,
    removePending,
    clearPending,
    uploadAll,
  };
}
