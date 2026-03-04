import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ChevronRight,
  Users,
  Loader2,
  UserPlus,
  Trash2,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetTemplateByIdQuery, useUpdateTemplateMutation } from "../api/teamTemplateApi";
import { useGetMembersQuery, useRemoveMemberMutation } from "../api/teamMemberTemplateApi";
import { AddMembersModal } from "../components/AddMembersModal";
import { DeleteTeamTemplateDialog } from "../components/DeleteTeamTemplateDialog";
import { UserProfileDrawer } from "@/features/user/components";

// ─── Settings form schema ────────────────────────────────────────────────────
const settingsSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(255, "Template name must not exceed 255 characters"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// ─── Member Row ──────────────────────────────────────────────────────────────
// ─── Members Tab ─────────────────────────────────────────────────────────────
function MembersTab({ templateId }: { templateId: number }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data, isLoading } = useGetMembersQuery(templateId);
  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation();
  const [removingId, setRemovingId] = useState<number | null>(null);

  const openProfile = (userId: number) => {
    setProfileUserId(userId);
    setIsProfileOpen(true);
  };

  const members = data?.data ?? [];

  const handleRemove = async (userId: number) => {
    setRemovingId(userId);
    try {
      await removeMember({ templateId, userId }).unwrap();
      toast.success("Member removed.");
    } catch {
      toast.error("Failed to remove member.");
    } finally {
      setRemovingId(null);
    }
  };

  const renderMemberList = () =>
    members.map((member) => {
      const user = member.userSummaryResponse;
      const displayName = user?.fullName ?? user?.email ?? null;
      const displayEmail = user?.fullName ? user.email : null;
      const avatarInitial = (user?.fullName ?? user?.email ?? "?")[0].toUpperCase();
      const userId = user?.id;

      return (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/30"
        >
          {/* Clickable left section — opens profile drawer */}
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            onClick={() => userId !== undefined && openProfile(userId)}
            disabled={userId === undefined}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-all hover:ring-2 hover:ring-primary/40">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName ?? "Avatar"}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                avatarInitial
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium transition-colors hover:text-primary hover:underline">
                {displayName ?? `User #${userId}`}
              </p>
              {displayEmail ? (
                <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Added {format(new Date(member.createdAt), "MMM d, yyyy")}
                </p>
              )}
            </div>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isRemoving && removingId === userId}
            onClick={() => userId !== undefined && handleRemove(userId)}
          >
            {isRemoving && removingId === userId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      );
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {members.length} {members.length === 1 ? "member" : "members"} in
          this template
        </p>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Members
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-12 text-center">
          <Users className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No members yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add members to this template.
          </p>
        </div>
      ) : (
        <div className="space-y-2">{renderMemberList()}</div>
      )}

      <AddMembersModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        templateId={templateId}
      />

      <UserProfileDrawer
        userId={profileUserId}
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({
  templateId,
  initialName,
  initialDescription,
}: {
  templateId: number;
  initialName: string;
  initialDescription: string | null;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [updateTemplate, { isLoading }] = useUpdateTemplateMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: initialName,
      description: initialDescription ?? "",
    },
  });

  useEffect(() => {
    reset({ name: initialName, description: initialDescription ?? "" });
  }, [initialName, initialDescription, reset]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateTemplate({
        id: templateId,
        name: values.name,
        description: values.description || undefined,
      }).unwrap();
      toast.success("Template updated successfully!");
      reset(values);
    } catch {
      toast.error("Failed to update template.");
    }
  };

  return (
    <div className="space-y-8 max-w-xl">
      {/* General Info */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">General</h3>
          <p className="text-sm text-muted-foreground">
            Update your team template name and description.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-name">Template Name *</Label>
          <Input
            id="settings-name"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-description">Description</Label>
          <textarea
            id="settings-description"
            rows={3}
            {...register("description")}
            placeholder="Optional description..."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              reset({
                name: initialName,
                description: initialDescription ?? "",
              })
            }
            disabled={!isDirty || isLoading}
          >
            Discard
          </Button>
          <Button type="submit" disabled={!isDirty || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>

      <Separator />

      {/* Danger Zone */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-destructive">
            Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground">
            These actions are irreversible. Please be certain.
          </p>
        </div>
        <Card className="border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete this template</p>
              <p className="text-xs text-muted-foreground">
                Once deleted, all member associations will be removed and cannot
                be recovered.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </Card>
      </div>

      <DeleteTeamTemplateDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        template={
          isDeleteOpen
            ? { id: templateId, name: initialName, ownerId: 0, description: initialDescription, createdAt: "", updatedAt: "" }
            : null
        }
        navigateAfterDelete
      />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function TeamTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const templateId = Number(id);

  const { data, isLoading, isError } = useGetTemplateByIdQuery(templateId, {
    skip: !templateId || isNaN(templateId),
  });

  const template = data?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          Template not found or failed to load.
        </p>
        <Button variant="outline" onClick={() => navigate("/team-templates")}>
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          to="/team-templates"
          className="transition-colors hover:text-foreground"
        >
          Team Templates
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{template.name}</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
          {template.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {template.description}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Created {format(new Date(template.createdAt), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <MembersTab templateId={templateId} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab
            templateId={templateId}
            initialName={template.name}
            initialDescription={template.description}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
