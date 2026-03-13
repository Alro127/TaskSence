import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Plus, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { TaskResponse } from "@/types/api";
import {
  useCreateTagMutation,
  useGetTagsByProjectQuery,
} from "@/features/tag/api";
import { TAG_COLOR_PRESETS } from "@/features/tag/constants/tagPalette";
import { TagBadge } from "@/features/tag/components";
import {
  useAddTagsToTaskMutation,
  useRemoveTagsFromTaskMutation,
} from "../api/taskApi";

interface TaskTagSelectorProps {
  projectId: number;
  task: TaskResponse;
  disabled?: boolean;
  onOpenBoardByTag?: (tagId: number) => void;
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function TaskTagSelector({ projectId, task, disabled, onOpenBoardByTag }: TaskTagSelectorProps) {
  const { data: tagsData } = useGetTagsByProjectQuery(projectId, {
    skip: Number.isNaN(projectId),
  });
  const projectTags = tagsData?.data ?? [];

  const [addTagsToTask, { isLoading: isAddingTags }] = useAddTagsToTaskMutation();
  const [removeTagsFromTask, { isLoading: isRemovingTags }] = useRemoveTagsFromTaskMutation();
  const [createTag, { isLoading: isCreatingTag }] = useCreateTagMutation();

  const [search, setSearch] = useState("");
  const [draftSelectedIds, setDraftSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setDraftSelectedIds((task.tags ?? []).map((t) => t.id));
  }, [task.id, task.tags]);

  const normalizedSearch = normalize(search);

  const filteredTags = useMemo(() => {
    const term = normalizedSearch.toLowerCase();
    return projectTags
      .filter((tag) => !term || tag.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projectTags, normalizedSearch]);

  const canCreateFromSearch =
    normalizedSearch.length > 0 &&
    !projectTags.some((tag) => tag.name.toLowerCase() === normalizedSearch.toLowerCase());

  const isDirty = useMemo(() => {
    const current = new Set((task.tags ?? []).map((t) => t.id));
    const draft = new Set(draftSelectedIds);
    if (current.size !== draft.size) return true;
    for (const id of draft) {
      if (!current.has(id)) {
        return true;
      }
    }
    return false;
  }, [draftSelectedIds, task.tags]);

  const isSaving = isAddingTags || isRemovingTags;

  function toggleTag(tagId: number) {
    setDraftSelectedIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  async function handleCreateFromSearch() {
    if (!canCreateFromSearch) return;

    try {
      const created = await createTag({
        projectId,
        body: {
          name: normalizedSearch,
          color: TAG_COLOR_PRESETS[0].value,
        },
      }).unwrap();

      setDraftSelectedIds((prev) => [...prev, created.data.id]);
      setSearch("");
      toast.success("Tag created");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create tag"));
    }
  }

  async function handleApply() {
    const currentIds = new Set((task.tags ?? []).map((t) => t.id));
    const draftIds = new Set(draftSelectedIds);

    const toAdd = Array.from(draftIds).filter((id) => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter((id) => !draftIds.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      return;
    }

    try {
      if (toAdd.length > 0) {
        await addTagsToTask({ projectId, taskId: task.id, tagIds: toAdd }).unwrap();
      }
      if (toRemove.length > 0) {
        await removeTagsFromTask({ projectId, taskId: task.id, tagIds: toRemove }).unwrap();
      }
      toast.success("Task tags updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update task tags"));
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Tags
      </p>

      <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
        {(task.tags ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No tags assigned.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {(task.tags ?? []).map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>

            {onOpenBoardByTag && (
              <div className="flex flex-wrap gap-1.5">
                {(task.tags ?? []).map((tag) => (
                  <button
                    key={`board-${tag.id}`}
                    type="button"
                    onClick={() => onOpenBoardByTag(tag.id)}
                    className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
                  >
                    Board: {tag.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="space-y-2 rounded-md border bg-background p-2">
          <div className="relative">
            <Tags className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags or create new..."
              className="pl-8 h-8"
              disabled={disabled || isSaving}
            />
          </div>

          {canCreateFromSearch && (
            <button
              type="button"
              onClick={handleCreateFromSearch}
              disabled={isCreatingTag || disabled || isSaving}
              className="flex w-full items-center gap-2 rounded-md border border-dashed px-2 py-1.5 text-left text-xs text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingTag ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Create "{normalizedSearch}"
            </button>
          )}

          <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
            {filteredTags.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">No matching tags</p>
            ) : (
              filteredTags.map((tag) => {
                const selected = draftSelectedIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left transition-colors",
                      selected ? "border-primary/50 bg-primary/5" : "hover:bg-muted/50",
                    )}
                    disabled={disabled || isSaving}
                  >
                    <TagBadge tag={tag} />
                    {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraftSelectedIds((task.tags ?? []).map((t) => t.id))}
            disabled={!isDirty || isSaving || disabled}
          >
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={!isDirty || isSaving || disabled}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
