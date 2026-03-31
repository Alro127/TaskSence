import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { UserSkill } from "@/types/api";
import { SkillStars, LEVEL_LABELS } from "./SkillStars";
import {
  useGetMySkillsQuery,
  useGetUserSkillsQuery,
  useAddSkillMutation,
  useUpdateSkillMutation,
  useDeleteSkillMutation,
} from "../api/userSkillApi";

// ---------------------------------------------------------------------------
// Level badge + progress bar styling maps
// ---------------------------------------------------------------------------
const LEVEL_BADGE_STYLES: Record<number, string> = {
  1: "bg-[rgba(68,70,81,0.08)] text-[#444651]",
  2: "bg-[rgba(35,58,135,0.08)] text-[#233a87]",
  3: "bg-[rgba(0,106,97,0.08)] text-[#006a61]",
  4: "bg-[rgba(35,58,135,0.12)] text-[#233a87]",
  5: "bg-[rgba(100,51,0,0.08)] text-[#643300]",
};

const LEVEL_PROGRESS_COLORS: Record<number, string> = {
  1: "bg-[#444651]",
  2: "bg-[#233a87]",
  3: "bg-[#006a61]",
  4: "bg-[#233a87]",
  5: "bg-[#643300]",
};

// ---------------------------------------------------------------------------
// Inline edit / add row
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
  label?: string;
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
  label = "Save",
}: SkillEditRowProps) {
  return (
    <div className="rounded-lg border border-[rgba(35,58,135,0.3)] bg-[rgba(35,58,135,0.03)] p-4 space-y-3 shadow-sm">
      <p className="text-xs font-semibold text-[#233a87] uppercase tracking-wider">
        {label === "Save" ? "Edit Skill" : "New Skill"}
      </p>

      <div className="flex items-center gap-3">
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. React, Python, Figma..."
          className="flex-1"
          disabled={isSaving}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
          autoFocus
        />
      </div>

      {/* Star picker with level preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkillStars value={level} onChange={onLevelChange} size="default" />
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              LEVEL_BADGE_STYLES[level]
            )}
          >
            {LEVEL_LABELS[level]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
            className="h-8 px-3 text-xs"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={isSaving || !name.trim()}
            className="h-8 px-3 text-xs"
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

      {nameError && (
        <p className="text-xs text-destructive">{nameError}</p>
      )}

      {/* Progress bar preview */}
      <div className="space-y-1">
        <p className="text-[10px] text-[#444651]">Level preview</p>
        <div className="h-1.5 rounded-full bg-[#efeeec] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              LEVEL_PROGRESS_COLORS[level]
            )}
            style={{ width: `${(level / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single skill card row (display mode)
// ---------------------------------------------------------------------------
interface SkillCardRowProps {
  skill: UserSkill;
  index: number;
  isOwnProfile: boolean;
  onEdit: (skill: UserSkill) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

function SkillCardRow({
  skill,
  index,
  isOwnProfile,
  onEdit,
  onDelete,
  isDeleting,
}: SkillCardRowProps) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-[rgba(197,197,211,0.35)] bg-white px-4 py-3 hover:border-[rgba(35,58,135,0.25)] hover:shadow-sm transition-all">
      {/* Rank */}
      <span className="w-5 shrink-0 text-xs text-[#444651] text-right font-mono select-none">
        {index + 1}
      </span>

      {/* Name + Progress bar */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-medium leading-none truncate">
          {skill.skillName}
        </p>
        <div className="h-1.5 rounded-full bg-[#efeeec] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              LEVEL_PROGRESS_COLORS[skill.level]
            )}
            style={{ width: `${(skill.level / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Level badge */}
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
          LEVEL_BADGE_STYLES[skill.level]
        )}
      >
        {LEVEL_LABELS[skill.level]}
      </span>

      {/* Action buttons — own profile only, revealed on hover */}
      {isOwnProfile && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onEdit(skill)}
            aria-label="Edit skill"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(skill.id)}
            disabled={isDeleting}
            aria-label="Delete skill"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      )}
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

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);

  const { data: ownData, isLoading: isLoadingOwn } = useGetMySkillsQuery(
    { page, size: PAGE_SIZE },
    { skip: !isOwnProfile }
  );
  const { data: otherData, isLoading: isLoadingOther } = useGetUserSkillsQuery(
    { userId: userId ?? 0, page, size: PAGE_SIZE },
    { skip: isOwnProfile }
  );

  const [addSkill, { isLoading: isAdding }] = useAddSkillMutation();
  const [updateSkill] = useUpdateSkillMutation();
  const [deleteSkill] = useDeleteSkillMutation();

  const pageResponse = isOwnProfile ? ownData?.data : otherData?.data;
  const skills: UserSkill[] = pageResponse?.data ?? [];
  const totalElements = pageResponse?.totalElements ?? 0;
  const totalPages = pageResponse?.totalPages ?? 1;
  const isLoading = isOwnProfile ? isLoadingOwn : isLoadingOther;

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState(3);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  // Add state
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
      toast.success("Skill updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update skill"));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (skillId: number) => {
    setIsDeletingId(skillId);
    try {
      await deleteSkill(skillId).unwrap();
      toast.success("Skill removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to remove skill"));
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
      toast.success("Skill added");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to add skill"));
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
      <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-3">
        <div className="h-4 w-36 rounded bg-[#efeeec] animate-pulse" />
        <div className="h-px w-full bg-[#efeeec]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-[rgba(197,197,211,0.35)] p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-[#efeeec] animate-pulse" />
              <div className="h-4 flex-1 rounded bg-[#efeeec] animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-[#efeeec] animate-pulse" />
            </div>
            <div className="h-1.5 rounded-full bg-[#efeeec] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  return (
    <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#444651]">
            Skills
          </p>
          <p className="mt-0.5 text-sm text-[#444651]">
            {isOwnProfile
              ? "Showcase your technical and professional skills."
              : "Skills declared by this user."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalElements > 0 && (
            <span className="rounded-full bg-[#e9e8e6] px-2 py-0.5 text-[10px] font-semibold text-[#444651]">
              {totalElements}
            </span>
          )}
          {isOwnProfile && (
            <Button
              type="button"
              size="sm"
              onClick={handleShowAddForm}
              disabled={showAddForm}
              className="bg-[#233a87] text-white hover:opacity-90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Skill
            </Button>
          )}
        </div>
      </div>

      <div className="h-px bg-[#efeeec]" />

      {/* Empty state */}
      {skills.length === 0 && !showAddForm && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)]">
            <Sparkles className="h-6 w-6 text-[#233a87]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1a1c1b]">
              {isOwnProfile ? "No skills added yet" : "No skills listed"}
            </p>
            <p className="max-w-xs text-xs text-[#444651]">
              {isOwnProfile
                ? "Showcase your expertise — add your technical, design, or soft skills."
                : "This user hasn't added any skills to their profile yet."}
            </p>
          </div>
          {isOwnProfile && (
            <Button
              size="sm"
              onClick={handleShowAddForm}
              className="bg-[#233a87] text-white hover:opacity-90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Your First Skill
            </Button>
          )}
        </div>
      )}

      {/* Inline add form — shown at top when no skills yet, or below the list */}
      {isOwnProfile && showAddForm && skills.length === 0 && (
        <SkillEditRow
          name={newName}
          level={newLevel}
          onNameChange={setNewName}
          onLevelChange={setNewLevel}
          onSave={handleAddSave}
          onCancel={() => setShowAddForm(false)}
          isSaving={isAdding}
          label="Add"
        />
      )}

      {/* Skill card list */}
      {skills.length > 0 && (
        <div className="space-y-2">
          {skills.map((skill, idx) =>
            editingId === skill.id ? (
              <SkillEditRow
                key={skill.id}
                name={editName}
                level={editLevel}
                onNameChange={setEditName}
                onLevelChange={setEditLevel}
                onSave={handleEditSave}
                onCancel={() => setEditingId(null)}
                isSaving={isSavingEdit}
                label="Save"
              />
            ) : (
              <SkillCardRow
                key={skill.id}
                skill={skill}
                index={idx}
                isOwnProfile={isOwnProfile}
                onEdit={handleEditStart}
                onDelete={handleDelete}
                isDeleting={isDeletingId === skill.id}
              />
            )
          )}

          {/* Add form at the bottom (when list already has skills) */}
          {isOwnProfile && showAddForm && (
            <SkillEditRow
              name={newName}
              level={newLevel}
              onNameChange={setNewName}
              onLevelChange={setNewLevel}
              onSave={handleAddSave}
              onCancel={() => setShowAddForm(false)}
              isSaving={isAdding}
              label="Add"
            />
          )}
        </div>
      )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-[#444651]">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}
