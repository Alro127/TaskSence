import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, AlertCircle, CalendarDays, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { updateCurrentUser } from "@/features/user/userSlice";
import { useUpdateUserProfileMutation } from "@/features/user/api/userApi";
import { AvatarUpload } from "@/features/user/components";
import { useAvatarUpload } from "@/features/user/hooks/useAvatarUpload";
import { SkillsSection } from "@/features/user/components/SkillsSection";
import { cn, getApiErrorMessage } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const profileEditSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be at most 255 characters"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(\+84|0)[0-9]{9}$/.test(val),
      "Phone must be a valid Vietnamese number (e.g. 0123456789 or +84123456789)"
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dob: z.string().optional(),
  bio: z.string().max(1000, "Bio must be at most 1000 characters").optional(),
});

type ProfileEditFormData = z.infer<typeof profileEditSchema>;

// ---------------------------------------------------------------------------
// Info tab — profile form
// ---------------------------------------------------------------------------
interface ProfileInfoTabProps {
  avatarState: ReturnType<typeof useAvatarUpload>;
}

function ProfileInfoTab({ avatarState }: ProfileInfoTabProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.currentUser);
  const [updateUserProfile, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation();

  const {
    selectedFile,
    uploadAvatarToS3,
    isUploading: isUploadingAvatar,
    clearPreview,
  } = avatarState;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      gender: (user?.gender as "MALE" | "FEMALE" | "OTHER") || undefined,
      dob: user?.dob ? user.dob.split("T")[0] : "",
      bio: user?.bio || "",
    },
  });

  const bioValue = watch("bio") || "";
  const hasUnsavedChanges = isDirty || !!selectedFile;
  const isLoading = isUpdating || isUploadingAvatar;

  // Khi user data được load về từ API (currentUser đang null lúc mount),
  // reset form với dữ liệu thực
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
        gender: (user.gender as "MALE" | "FEMALE" | "OTHER") || undefined,
        dob: user.dob ? user.dob.split("T")[0] : "",
        bio: user.bio || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileEditFormData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        fullName: data.fullName || undefined,
        phone: data.phone || undefined,
        gender: data.gender || undefined,
        dob: data.dob || undefined,
        bio: data.bio || undefined,
      };

      if (selectedFile) {
        try {
          const fileUrl = await uploadAvatarToS3();
          if (fileUrl) payload.avatarUrl = fileUrl;
        } catch {
          toast.error("Avatar upload failed", {
            description: "Failed to upload avatar. Please try again.",
          });
          return;
        }
      }

      const response = await updateUserProfile(payload).unwrap();
      dispatch(updateCurrentUser(response.data));
      clearPreview();
      reset({
        fullName: response.data.fullName || "",
        phone: response.data.phone || "",
        gender:
          (response.data.gender as "MALE" | "FEMALE" | "OTHER") || undefined,
        dob: response.data.dob ? response.data.dob.split("T")[0] : "",
        bio: response.data.bio || "",
      });
      toast.success("Profile updated successfully!", {
        description: response.message || "Your changes have been saved.",
      });
    } catch (error) {
      toast.error("Failed to update profile", {
        description: getApiErrorMessage(error, "Something went wrong. Please try again."),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Unsaved changes banner */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 rounded-md border border-[rgba(100,51,0,0.2)] bg-[rgba(100,51,0,0.06)] px-4 py-2.5 text-sm text-[#643300]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          You have unsaved changes — click "Save Changes" to apply.
        </div>
      )}

      <Card className="p-6 space-y-6">
        {/* Section: Personal Information */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              Personal Information
            </h3>
            <p className="text-xs text-muted-foreground">
              Basic details visible on your profile
            </p>
          </div>

          {/* 2-column: Full Name + Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="e.g., Nguyễn Văn A"
                disabled={isLoading}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) =>
                      field.onChange(
                        (v as "MALE" | "FEMALE" | "OTHER") || undefined
                      )
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other / Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && (
                <p className="text-xs text-destructive">
                  {errors.gender.message}
                </p>
              )}
            </div>
          </div>

          {/* 2-column: Phone + Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0123456789"
                disabled={isLoading}
                {...register("phone")}
              />
              {errors.phone ? (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Vietnamese format (0xxx or +84xxx)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob" className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                disabled={isLoading}
                {...register("dob")}
              />
              {errors.dob && (
                <p className="text-xs text-destructive">{errors.dob.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#efeeec]" />

        {/* Section: Contact */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Account Email
            </h3>
            <p className="text-xs text-muted-foreground">
              Cannot be changed — linked to your account
            </p>
          </div>
          <Input
            id="email"
            type="email"
            value={user?.email || ""}
            disabled
            className="bg-muted cursor-not-allowed"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-[#efeeec]" />

        {/* Section: Bio */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio">Bio</Label>
            <span
              className={cn(
                "text-xs tabular-nums",
                bioValue.length > 950
                  ? "text-destructive font-medium"
                  : "text-muted-foreground"
              )}
            >
              {bioValue.length} / 1000
            </span>
          </div>
          <Textarea
            id="bio"
            placeholder="Tell others about yourself, your experience, or what you're working on..."
            rows={4}
            disabled={isLoading}
            {...register("bio")}
          />
          {errors.bio && (
            <p className="text-xs text-destructive">{errors.bio.message}</p>
          )}
        </div>
      </Card>

      {/* Form actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            clearPreview();
          }}
          disabled={isLoading || !hasUnsavedChanges}
        >
          Discard
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !hasUnsavedChanges}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ProfilePage
// ---------------------------------------------------------------------------
export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.user.currentUser);
  const avatarState = useAvatarUpload();
  const { selectedFile, clearPreview, previewUrl, validateAndPreview } = avatarState;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        {/* ── Profile Hero ── */}
        <div className="ghost-border rounded-xl overflow-hidden bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          {/* Cover banner */}
          <div className="h-28 bg-[#233a87] relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,#86f2e4,transparent_60%)]" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_80%,#f5d49e,transparent_50%)]" />
          </div>

          {/* Avatar + Identity row */}
          <div className="px-6 pb-5 -mt-10 flex items-end gap-4">
            {/* Circular avatar with upload */}
            <AvatarUpload
              currentAvatarUrl={user?.avatarUrl}
              userName={user?.fullName || "User"}
              previewUrl={previewUrl}
              validateAndPreview={validateAndPreview}
              clearPreview={clearPreview}
            />

            {/* Name + Email */}
            <div className="pb-1 min-w-0 flex-1">
              <h2 className="text-lg font-semibold leading-tight truncate">
                {user?.fullName || (
                  <span className="text-muted-foreground italic">No name set</span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {user?.email}
              </p>
              {previewUrl && (
                <p className="text-xs text-[#643300] font-medium mt-1">
                  Avatar preview active
                </p>
              )}
            </div>

            {/* Right-side meta */}
            {user?.gender && (
              <div className="pb-1 hidden sm:block shrink-0">
                <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                  {user.gender === "MALE" ? "Male" : user.gender === "FEMALE" ? "Female" : "Other"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="info">
          <TabsList className="mb-5">
            <TabsTrigger value="info" className="relative">
              Info
              {(!!selectedFile) && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#643300]" />
              )}
            </TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <ProfileInfoTab avatarState={avatarState} />
          </TabsContent>

          <TabsContent value="skills">
            <SkillsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
