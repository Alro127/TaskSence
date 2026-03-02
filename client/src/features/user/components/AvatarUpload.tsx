import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string;
  previewUrl: string | null;
  validateAndPreview: (file: File) => Promise<boolean>;
  clearPreview: () => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  userName = "User",
  previewUrl,
  validateAndPreview,
  clearPreview,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await validateAndPreview(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const isPreviewMode = previewUrl !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {/* Square Avatar Box 1:1 */}
        <div className="relative h-32 w-32">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={userName}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted">
              <span className="text-center text-xs text-muted-foreground px-2">
                No avatar
              </span>
            </div>
          )}

          {/* Preview Badge */}
          {isPreviewMode && (
            <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded bg-amber-100 dark:bg-amber-900 px-2 py-1">
              <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                Preview
              </span>
            </div>
          )}
        </div>

        {/* File Input Hidden */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload avatar image"
        />

        {/* Upload Instructions */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Avatar</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, or WebP (max 5MB)</p>
        </div>
      </div>

      {/* Action Buttons */}
      {!isPreviewMode ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose Image
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            Choose Different
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isPreviewMode && (
        <p className="text-xs text-muted-foreground text-center">
          Preview shown. Click "Save Changes" to confirm and upload.
        </p>
      )}
    </div>
  );
}
