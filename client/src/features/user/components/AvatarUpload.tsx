import { useRef } from "react";
import { Camera, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string;
  previewUrl: string | null;
  validateAndPreview: (file: File) => Promise<boolean>;
  clearPreview: () => void;
  /** Extra classes for the outer wrapper */
  className?: string;
}

/**
 * Circular hero avatar with a camera hover overlay.
 * Clicking the avatar opens the file picker.
 * When a preview is active, a small amber dot and a cancel button appear.
 */
export function AvatarUpload({
  currentAvatarUrl,
  userName = "User",
  previewUrl,
  validateAndPreview,
  clearPreview,
  className,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await validateAndPreview(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const isPreviewMode = previewUrl !== null;

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Clickable circular avatar */}
      <button
        type="button"
        className="group relative w-20 h-20 rounded-full ring-4 ring-background overflow-hidden focus:outline-none focus-visible:ring-primary transition-shadow hover:shadow-md"
        onClick={() => fileInputRef.current?.click()}
        title="Click to change photo"
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={userName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Camera overlay on hover */}
        <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-5 h-5 text-white" />
          <span className="text-[9px] text-white font-medium leading-none">Change</span>
        </div>
      </button>

      {/* Unsaved-preview indicator dot */}
      {isPreviewMode && (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 border-2 border-background"
          title="Preview not saved yet"
        >
          <span className="text-[8px] text-white font-bold leading-none">!</span>
        </span>
      )}

      {/* Cancel preview */}
      {isPreviewMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            clearPreview();
          }}
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border hover:bg-muted transition-colors"
          title="Cancel preview"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload avatar image"
      />
    </div>
  );
}
