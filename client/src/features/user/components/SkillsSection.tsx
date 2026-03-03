import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { UserSkill } from "@/types/api";
import { SkillStars } from "./SkillStars";
import {
  useGetMySkillsQuery,
  useGetUserSkillsQuery,
  useAddSkillMutation,
  useUpdateSkillMutation,
  useDeleteSkillMutation,
} from "../api/userSkillApi";

// ---------------------------------------------------------------------------
// Inline edit row
// ---------------------------------------------------------------------------
interface SkillEditRowProps {
  name: string;
  level: number;
  onNameChange: (v: string) => void;
  onLevelChange: (v: number) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  nameError?: string;
}

function SkillEditRow({
  name,
  level,
  onNameChange,
  onLevelChange,
  onSave,
  onCancel,
  isSaving,
  nameError,
}: SkillEditRowProps) {
  return (
    <div className="space-y-2 rounded-md border border-primary/30 bg-muted/40 p-3">
      <div className="flex items-center gap-3">
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. React, Python, Figma..."
          className="h-8 flex-1 text-sm"
          disabled={isSaving}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
          autoFocus
        />
        <SkillStars value={level} onChange={onLevelChange} />
      </div>
      {nameError && (
        <p className="text-xs text-destructive">{nameError}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
          className="h-7 px-2 text-xs"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !name.trim()}
          className="h-7 px-3 text-xs"
        >
          {isSaving ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="mr-1 h-3.5 w-3.5" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SkillsSection
// ---------------------------------------------------------------------------
interface SkillsSectionProps {
  /** If provided, renders a read-only view of another user's skills */
  userId?: number;
}

export function SkillsSection({ userId }: SkillsSectionProps) {
  const isOwnProfile = !userId;

  // Both hooks called unconditionally; RTK Query `skip` controls which runs
  const { data: ownData, isLoading: isLoadingOwn } = useGetMySkillsQuery(
    undefined,
    { skip: !isOwnProfile }
  );
  const { data: otherData, isLoading: isLoadingOther } = useGetUserSkillsQuery(
    userId ?? 0,
    { skip: isOwnProfile }
  );

  const [addSkill, { isLoading: isAdding }] = useAddSkillMutation();
  const [updateSkill] = useUpdateSkillMutation();
  const [deleteSkill] = useDeleteSkillMutation();

  const skills: UserSkill[] = isOwnProfile
    ? (ownData?.data ?? [])
    : (otherData?.data ?? []);
  const isLoading = isOwnProfile ? isLoadingOwn : isLoadingOther;

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState(3);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState(3);

  // ---------------------------------------------------------------------------
  const handleEditStart = (skill: UserSkill) => {
    setEditingId(skill.id);
    setEditName(skill.skillName);
    setEditLevel(skill.level);
    setShowAddForm(false);
  };

  const handleEditSave = async () => {
    if (!editName.trim() || editingId === null) return;
    setIsSavingEdit(true);
    try {
      await updateSkill({
        skillId: editingId,
        data: { skillName: editName.trim(), level: editLevel },
      }).unwrap();
      setEditingId(null);
      toast.success("Skill updated successfully");
    } catch {
      toast.error("Failed to update skill", {
        description: "Please try again.",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEditCancel = () => setEditingId(null);

  const handleDelete = async (skillId: number) => {
    setIsDeletingId(skillId);
    try {
      await deleteSkill(skillId).unwrap();
      toast.success("Skill removed");
    } catch {
      toast.error("Failed to remove skill");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleAddSave = async () => {
    if (!newName.trim()) return;
    try {
      await addSkill({ skillName: newName.trim(), level: newLevel }).unwrap();
      setNewName("");
      setNewLevel(3);
      setShowAddForm(false);
      toast.success("Skill added successfully");
    } catch {
      toast.error("Failed to add skill", {
        description: "Please try again.",
      });
    }
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
    setEditingId(null);
    setNewName("");
    setNewLevel(3);
  };

  // ---------------------------------------------------------------------------
  // Loading skeleton
  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  return (
    <Card className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Skills</h3>
          <p className="text-sm text-muted-foreground">
            {isOwnProfile
              ? "Showcase your technical and professional skills."
              : "Skills declared by this user."}
          </p>
        </div>
        {isOwnProfile && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleShowAddForm}
            disabled={showAddForm}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Skill
          </Button>
        )}
      </div>

      <Separator />

      {/* Empty state */}
      {skills.length === 0 && !showAddForm && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {isOwnProfile
            ? "No skills yet. Click \"Add Skill\" to get started."
            : "This user hasn't added any skills yet."}
        </div>
      )}

      {/* Skill list */}
      {skills.length > 0 && (
        <ul className="space-y-1.5">
          {skills.map((skill, idx) => (
            <li key={skill.id}>
              {/* Edit mode */}
              {editingId === skill.id ? (
                <SkillEditRow
                  name={editName}
                  level={editLevel}
                  onNameChange={setEditName}
                  onLevelChange={setEditLevel}
                  onSave={handleEditSave}
                  onCancel={handleEditCancel}
                  isSaving={isSavingEdit}
                />
              ) : (
                /* Display mode */
                <div
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
                    "hover:bg-muted/60"
                  )}
                >
                  {/* Rank number */}
                  <span className="w-5 text-right text-xs text-muted-foreground select-none">
                    {idx + 1}.
                  </span>

                  {/* Skill name */}
                  <span className="flex-1 text-sm font-medium">
                    {skill.skillName}
                  </span>

                  {/* Stars */}
                  <SkillStars value={skill.level} size="sm" showLabel />

                  {/* Actions — only on own profile */}
                  {isOwnProfile && (
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEditStart(skill)}
                        aria-label="Edit skill"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(skill.id)}
                        disabled={isDeletingId === skill.id}
                        aria-label="Delete skill"
                      >
                        {isDeletingId === skill.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Inline add form */}
      {isOwnProfile && showAddForm && (
        <SkillEditRow
          name={newName}
          level={newLevel}
          onNameChange={setNewName}
          onLevelChange={setNewLevel}
          onSave={handleAddSave}
          onCancel={() => setShowAddForm(false)}
          isSaving={isAdding}
        />
      )}
    </Card>
  );
}
