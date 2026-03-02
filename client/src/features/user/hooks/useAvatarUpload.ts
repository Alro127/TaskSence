import { useState } from "react";
import { toast } from "sonner";
import { useGetAvatarPresignUrlMutation } from "../api/userApi";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

interface UseAvatarUploadReturn {
  isUploading: boolean;
  previewUrl: string | null;
  selectedFile: File | null;
  validateAndPreview: (file: File) => Promise<boolean>;
  uploadAvatarToS3: () => Promise<string | null>;
  clearPreview: () => void;
}

export function useAvatarUpload(): UseAvatarUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [getPresignUrl] = useGetAvatarPresignUrlMutation();

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: `Maximum file size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });
      return false;
    }

    // Check file type
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error("Invalid file type", {
        description: `Only JPG, PNG, and WebP are allowed. Got: ${file.type || ext}`,
      });
      return false;
    }

    // Validate by checking if it's actually an image
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", {
        description: "Please upload a valid image file",
      });
      return false;
    }

    return true;
  };

  const validateAndPreview = async (file: File): Promise<boolean> => {
    if (!validateFile(file)) return false;

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setSelectedFile(file);
      return true;
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Failed to create preview");
      return false;
    }
  };

  const uploadAvatarToS3 = async (): Promise<string | null> => {
    if (!selectedFile) {
      toast.error("No file selected");
      return null;
    }

    try {
      setIsUploading(true);

      // Extract fileName and extension
      const parts = selectedFile.name.split(".");
      const extension = "." + parts.pop();
      const fileName = parts.join(".");

      // Get presigned URL from backend
      const presignResponse = await getPresignUrl({
        fileName,
        extension,
      }).unwrap();

      const { uploadUrl, fileUrl } = presignResponse.data;

      // Upload file directly to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
      }

      return fileUrl;
    } catch (error) {
      console.error("Avatar S3 upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  return {
    isUploading,
    previewUrl,
    selectedFile,
    validateAndPreview,
    uploadAvatarToS3,
    clearPreview,
  };
}
