import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/utils";
import type { TagResponse } from "@/types/api";
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useGetTagsByProjectQuery,
  useUpdateTagMutation,
} from "@/features/tag/api";
import { TAG_COLOR_PRESETS, isValidHexColor } from "@/features/tag/constants/tagPalette";
import { TagBadge } from "@/features/tag/components";

interface ProjectTagsTabProps {
  projectId: number;
  isManager: boolean;
}

function normalizeTagInput(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function TagForm({
  name,
  color,
  onNameChange,
  onColorChange,
}: {
  name: string;
  color: string;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Name
        </p>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="E.g. Backend, Bug, Critical"
          maxLength={50}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Color
        </p>
        <div className="flex flex-wrap gap-2">
          {TAG_COLOR_PRESETS.map((preset) => {
            const active = color === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onColorChange(preset.value)}
                className="group inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors"
                style={{
                  color: preset.value,
                  borderColor: active ? preset.value : undefined,
                  backgroundColor: active ? `${preset.value}1A` : undefined,
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: preset.value }}
                />
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={isValidHexColor(color) ? color : "#2563EB"}
            onChange={(e) => onColorChange(e.target.value.toUpperCase())}
            className="h-8 w-10 cursor-pointer rounded border border-input bg-background"
            aria-label="Pick custom color"
          />
          <Input
            value={color}
            onChange={(e) => onColorChange(e.target.value.toUpperCase())}
            placeholder="#2563EB"
            maxLength={7}
            className="h-8 w-28 text-xs"
          />
          <span className="text-xs text-muted-foreground">Custom hex</span>
        </div>
      </div>
    </div>
  );
}

export function ProjectTagsTab({ projectId, isManager }: ProjectTagsTabProps) {
  const { data, isLoading } = useGetTagsByProjectQuery(projectId, {
    skip: Number.isNaN(projectId),
  });
  const tags = data?.data ?? [];

  const [createTag, { isLoading: isCreating }] = useCreateTagMutation();
  const [updateTag, { isLoading: isUpdating }] = useUpdateTagMutation();
  const [deleteTag, { isLoading: isDeleting }] = useDeleteTagMutation();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLOR_PRESETS[0].value);

  const [editingTag, setEditingTag] = useState<TagResponse | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(TAG_COLOR_PRESETS[0].value);

  const [deleteTarget, setDeleteTarget] = useState<TagResponse | null>(null);

  const sortedTags = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name)),
    [tags],
  );

  async function handleCreate() {
    const normalizedName = normalizeTagInput(newName);
    if (!normalizedName) {
      toast.error("Tag name is required");
      return;
    }

    try {
      await createTag({
        projectId,
        body: {
          name: normalizedName,
          color: isValidHexColor(newColor) ? newColor : undefined,
        },
      }).unwrap();

      toast.success("Tag created");
      setNewName("");
      setNewColor(TAG_COLOR_PRESETS[0].value);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create tag"));
    }
  }

  function openEdit(tag: TagResponse) {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color && isValidHexColor(tag.color) ? tag.color : TAG_COLOR_PRESETS[0].value);
  }

  async function handleSaveEdit() {
    if (!editingTag) return;

    const normalizedName = normalizeTagInput(editName);
    if (!normalizedName) {
      toast.error("Tag name is required");
      return;
    }

    try {
      await updateTag({
        projectId,
        tagId: editingTag.id,
        body: {
          name: normalizedName,
          color: isValidHexColor(editColor) ? editColor : undefined,
        },
      }).unwrap();

      toast.success("Tag updated");
      setEditingTag(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update tag"));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await deleteTag({ projectId, tagId: deleteTarget.id }).unwrap();
      toast.success("Tag deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete tag"));
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold">Project Tags</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tags are shared across this project and can be attached to tasks.
          </p>
        </div>

        {isManager ? (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <TagForm
              name={newName}
              color={newColor}
              onNameChange={setNewName}
              onColorChange={setNewColor}
            />

            <Button size="sm" onClick={handleCreate} disabled={isCreating || !newName.trim()}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Tag
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            You can view tags. Only managers can create, edit, or delete tags.
          </p>
        )}

        {isLoading ? (
          <div className="py-4 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading tags...
          </div>
        ) : sortedTags.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            No tags yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <TagBadge tag={tag} />
                {isManager && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(tag)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(tag)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update name and color for this project tag.
            </DialogDescription>
          </DialogHeader>

          <TagForm
            name={editName}
            color={editColor}
            onNameChange={setEditName}
            onColorChange={setEditColor}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTag(null)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating || !editName.trim()}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Delete this tag from the project? Existing task-tag links may also be removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
