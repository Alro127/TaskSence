import React, { useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Upload,
  X,
  Trash2,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileCode,
  Paperclip,
  Loader2,
  CheckSquare,
  Square,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AttachmentResponse } from "@/types/api";

import {
  useGetTaskAttachmentsQuery,
  useDeleteAttachmentsMutation,
} from "../api/attachmentApi";
import {
  useAttachmentUpload,
  type PendingFile,
} from "../hooks/useAttachmentUpload";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith("image/");
}

function getFileIcon(mimeType: string | null): React.ReactNode {
  if (!mimeType) return <File className="h-5 w-5 text-[#444651]" />;
  if (mimeType.startsWith("image/"))
    return <FileImage className="h-5 w-5 text-[#233a87]" />;
  if (mimeType === "application/pdf")
    return <FileText className="h-5 w-5 text-[#ba1a1a]" />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className="h-5 w-5 text-[#233a87]" />;
  if (
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet") ||
    mimeType === "text/csv"
  )
    return <FileSpreadsheet className="h-5 w-5 text-[#006a61]" />;
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
    return <File className="h-5 w-5 text-[#643300]" />;
  if (mimeType.startsWith("video/"))
    return <FileVideo className="h-5 w-5 text-[#444651]" />;
  if (mimeType === "application/zip" || mimeType === "application/x-zip-compressed")
    return <File className="h-5 w-5 text-[#643300]" />;
  if (mimeType.startsWith("text/"))
    return <FileCode className="h-5 w-5 text-[#006a61]" />;
  return <File className="h-5 w-5 text-[#444651]" />;
}

function getDisplayName(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    const parts = url.pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1]);
  } catch {
    return fileUrl.split("/").pop() ?? "File";
  }
}

// ─── Pending File Item ─────────────────────────────────────────────────────────

function PendingFileItem({
  pending,
  onRemove,
}: {
  pending: PendingFile;
  onRemove: () => void;
}) {
  const { file, previewUrl, error } = pending;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border px-3 py-2",
        error
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-background",
      )}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="h-9 w-9 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted">
          {getFileIcon(file.type)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        )}
      </div>

      <button
        onClick={onRemove}
        className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
        title="Xóa"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Image Thumbnail ───────────────────────────────────────────────────────────

function ImageThumbnail({
  attachment,
  selected,
  selectMode,
  onToggleSelect,
  onDelete,
}: {
  attachment: AttachmentResponse;
  selected: boolean;
  selectMode: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}) {
  const name = getDisplayName(attachment.fileUrl);
  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
        selected && "ring-2 ring-primary ring-offset-1",
      )}
    >
      <img
        src={attachment.fileUrl}
        alt={name}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />

      {/* Select mode checkbox */}
      {selectMode && (
        <button
          onClick={onToggleSelect}
          className="absolute left-1.5 top-1.5 drop-shadow"
          aria-label={`${selected ? "Bỏ chọn" : "Chọn"} ${name}`}
        >
          {selected ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4 text-white" />
          )}
        </button>
      )}

      {/* Action buttons — non-select mode */}
      {!selectMode && (
        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <a
            href={attachment.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
            title="Mở file"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-3 w-3" />
          </a>
          <button
            onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white hover:bg-red-600"
            title="Xóa"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Full-area click target in select mode */}
      {selectMode && (
        <button
          className="absolute inset-0"
          onClick={onToggleSelect}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ─── Document Row ──────────────────────────────────────────────────────────────

function DocumentRow({
  attachment,
  selected,
  selectMode,
  onToggleSelect,
  onDelete,
}: {
  attachment: AttachmentResponse;
  selected: boolean;
  selectMode: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}) {
  const name = getDisplayName(attachment.fileUrl);
  const meta = [
    formatFileSize(attachment.fileSize),
    format(new Date(attachment.createdAt), "MMM d, yyyy"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/40",
        selected && "bg-primary/5",
      )}
    >
      {selectMode && (
        <button
          onClick={onToggleSelect}
          className="shrink-0 text-muted-foreground"
          aria-label={`${selected ? "Bỏ chọn" : "Chọn"} ${name}`}
        >
          {selected ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      )}

      <div className="shrink-0">{getFileIcon(attachment.fileType)}</div>

      <div className="min-w-0 flex-1">
        <a
          href={attachment.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm font-medium hover:text-primary hover:underline"
        >
          {name}
        </a>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>

      {!selectMode && (
        <button
          onClick={onDelete}
          className="invisible shrink-0 text-muted-foreground transition-colors hover:text-destructive group-hover:visible"
          title="Xóa"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface AttachmentSectionProps {
  taskId: number;
}

export function AttachmentSection({ taskId }: AttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

  const { data, isLoading } = useGetTaskAttachmentsQuery(taskId);
  const attachments = data?.data ?? [];

  const [deleteAttachments, { isLoading: isDeleting }] =
    useDeleteAttachmentsMutation();

  const { pendingFiles, isUploading, addFiles, removePending, clearPending, uploadAll } =
    useAttachmentUpload();

  const imageAttachments = attachments.filter((a) => isImageMime(a.fileType));
  const docAttachments = attachments.filter((a) => !isImageMime(a.fileType));
  const validPendingCount = pendingFiles.filter((p) => !p.error).length;

  // ─── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  // ─── Select mode ────────────────────────────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // ─── Delete handlers ─────────────────────────────────────────────────────────
  async function handleDeleteSingle(attachmentId: number) {
    try {
      await deleteAttachments({ attachmentIds: [attachmentId], taskId }).unwrap();
      toast.success("Đã xóa attachment");
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleteTargetId(null);
    }
  }

  async function handleDeleteBatch() {
    try {
      await deleteAttachments({
        attachmentIds: Array.from(selectedIds),
        taskId,
      }).unwrap();
      toast.success(`Đã xóa ${selectedIds.size} attachment`);
      exitSelectMode();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setShowBatchDeleteDialog(false);
    }
  }

  return (
    <Card className="p-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Attachments</span>
          {attachments.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {attachments.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowBatchDeleteDialog(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete ({selectedIds.size})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={exitSelectMode}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              {attachments.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectMode(true)}
                >
                  Select
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Add Files
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Drop Zone ── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed py-5 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/30",
        )}
      >
        <Upload
          className={cn(
            "h-5 w-5",
            isDragging ? "text-primary" : "text-muted-foreground",
          )}
        />
        <p className="text-xs text-muted-foreground">
          Kéo thả file vào đây, hoặc{" "}
          <span className="text-primary hover:underline">chọn file</span>
        </p>
        <p className="text-[11px] text-muted-foreground/60">
          Ảnh, PDF, tài liệu — tối đa 50MB mỗi file
        </p>
      </div>

      {/* ── Pending Files (staging area) ── */}
      {pendingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Chờ upload ({pendingFiles.length})
          </p>
          <div className="space-y-1.5">
            {pendingFiles.map((p) => (
              <PendingFileItem
                key={p.uid}
                pending={p}
                onRemove={() => removePending(p.uid)}
              />
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={clearPending}
              disabled={isUploading}
            >
              Xóa tất cả
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => uploadAll(taskId)}
              disabled={isUploading || validPendingCount === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Đang upload...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload{validPendingCount > 0 ? ` (${validPendingCount})` : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Existing Attachments ── */}
      {isLoading ? (
        <div className="mt-4 flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Chưa có attachment nào
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Images — thumbnail grid */}
          {imageAttachments.length > 0 && (
            <div>
              {docAttachments.length > 0 && (
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ảnh
                </p>
              )}
              <div className="grid grid-cols-4 gap-2">
                {imageAttachments.map((a) => (
                  <ImageThumbnail
                    key={a.id}
                    attachment={a}
                    selected={selectedIds.has(a.id)}
                    selectMode={selectMode}
                    onToggleSelect={() => toggleSelect(a.id)}
                    onDelete={() => setDeleteTargetId(a.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Documents — list rows */}
          {docAttachments.length > 0 && (
            <div>
              {imageAttachments.length > 0 && (
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Files
                </p>
              )}
              <div className="space-y-0.5">
                {docAttachments.map((a) => (
                  <DocumentRow
                    key={a.id}
                    attachment={a}
                    selected={selectedIds.has(a.id)}
                    selectMode={selectMode}
                    onToggleSelect={() => toggleSelect(a.id)}
                    onDelete={() => setDeleteTargetId(a.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip,application/x-zip-compressed"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* ── Single Delete Dialog ── */}
      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa attachment</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa attachment này? Hành động này không thể hoàn
              tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTargetId(null)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTargetId !== null && handleDeleteSingle(deleteTargetId)
              }
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Batch Delete Dialog ── */}
      <Dialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa attachments</DialogTitle>
            <DialogDescription>
              Xóa {selectedIds.size} attachment đã chọn? Hành động này không
              thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBatchDeleteDialog(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBatch}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa ({selectedIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
