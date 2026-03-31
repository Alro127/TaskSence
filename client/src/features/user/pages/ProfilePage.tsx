import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  AlertCircle,
  CalendarDays,
  Phone,
  UserRound,
  Sparkles,
  Camera,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      "Invalid phone number (e.g. 0123456789 or +84123456789)"
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dob: z.string().optional(),
  bio: z
    .string()
    .max(1000, "Bio must be at most 1000 characters")
    .optional(),
});

type ProfileEditFormData = z.infer<typeof profileEditSchema>;
type ActiveTab = "info" | "skills";

// ---------------------------------------------------------------------------
// ProfilePage
// ---------------------------------------------------------------------------
export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.currentUser);
  const avatarState = useAvatarUpload();
  const {
    selectedFile,
    uploadAvatarToS3,
    isUploading: isUploadingAvatar,
    clearPreview,
    previewUrl,
    validateAndPreview,
  } = avatarState;

  const [updateUserProfile, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation();
  const [activeTab, setActiveTab] = useState<ActiveTab>("info");

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
      toast.success("Profile updated!", {
        description: response.message || "Your changes have been saved.",
      });
    } catch (error) {
      toast.error("Failed to update profile", {
        description: getApiErrorMessage(
          error,
          "Something went wrong. Please try again."
        ),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* ── Page Header ── */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#444651]">
          Account
        </p>
        <h1
          className="text-3xl font-bold text-[#1a1c1b]"
          style={{
            fontFamily: "'Epilogue', 'Inter', sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          My Profile
        </h1>
        <p className="mt-1 text-sm text-[#444651]">
          Manage your personal information and skills
        </p>
      </div>

      {/* ── Profile Hero Card ── */}
      <div className="ghost-border overflow-hidden rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        {/* Cover banner */}
        <div className="relative h-24 overflow-hidden bg-[#233a87]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#86f2e4,transparent_60%)] opacity-20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,#b7c4ff,transparent_50%)] opacity-10" />
        </div>

        {/* Avatar + Identity */}
        <div className="-mt-8 flex flex-wrap items-end gap-4 px-5 pb-4">
          <AvatarUpload
            currentAvatarUrl={user?.avatarUrl}
            userName={user?.fullName || "User"}
            previewUrl={previewUrl}
            validateAndPreview={validateAndPreview}
            clearPreview={clearPreview}
          />

          <div className="min-w-0 flex-1 pb-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="text-base font-semibold leading-tight text-[#1a1c1b]"
                style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
              >
                {user?.fullName || (
                  <span className="italic text-[#444651]">No name set</span>
                )}
              </h2>
              {user?.gender && (
                <span className="rounded-full border border-[rgba(197,197,211,0.35)] px-2 py-0.5 text-[11px] text-[#444651]">
                  {user.gender === "MALE"
                    ? "Male"
                    : user.gender === "FEMALE"
                      ? "Female"
                      : "Other"}
                </span>
              )}
              {user?.dob && (
                <span className="hidden rounded-full border border-[rgba(197,197,211,0.35)] px-2 py-0.5 text-[11px] text-[#444651] sm:inline-flex items-center gap-1">
                  <CalendarDays className="h-2.5 w-2.5" />
                  {new Date(user.dob).getFullYear()}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-[#444651]">
              {user?.email}
            </p>
            {previewUrl && (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[#643300]">
                <Camera className="h-3 w-3" />
                Avatar preview — save to apply
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Segmented Tab Control ── */}
      <div className="flex gap-1 rounded-xl bg-[#f4f3f1] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={cn(
            "relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            activeTab === "info"
              ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-[#233a87]"
              : "text-[#444651] hover:text-[#1a1c1b]"
          )}
        >
          <UserRound className="h-4 w-4 shrink-0" />
          <span>Profile Info</span>
          {hasUnsavedChanges && activeTab !== "info" && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#643300]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("skills")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            activeTab === "skills"
              ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-[#233a87]"
              : "text-[#444651] hover:text-[#1a1c1b]"
          )}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>Skills</span>
        </button>
      </div>

      {/* ── Tab: Profile Info ── */}
      {activeTab === "info" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Unsaved changes banner */}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 rounded-md border border-[rgba(100,51,0,0.2)] bg-[rgba(100,51,0,0.06)] px-4 py-2.5 text-sm text-[#643300]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              You have unsaved changes — click "Save Changes" to apply.
            </div>
          )}

          <div className="ghost-border space-y-5 rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            {/* Section label */}
            <p className="text-xs font-semibold uppercase tracking-widest text-[#444651]">
              Personal Information
            </p>

            {/* Full Name + Gender */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[#444651]">
                  Full Name{" "}
                  <span className="text-[#ba1a1a]">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="e.g., Nguyễn Văn A"
                  disabled={isLoading}
                  className={cn(
                    errors.fullName &&
                      "border-[#ba1a1a] focus-visible:ring-[rgba(186,26,26,0.2)]"
                  )}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="flex items-center gap-1 text-xs text-[#ba1a1a]">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-[#444651]">
                  Gender
                </Label>
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
                        <SelectItem value="OTHER">
                          Other / Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Phone + DoB */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="flex items-center gap-1.5 text-[#444651]"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0123456789"
                  disabled={isLoading}
                  className={cn(
                    errors.phone &&
                      "border-[#ba1a1a] focus-visible:ring-[rgba(186,26,26,0.2)]"
                  )}
                  {...register("phone")}
                />
                {errors.phone ? (
                  <p className="flex items-center gap-1 text-xs text-[#ba1a1a]">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.phone.message}
                  </p>
                ) : (
                  <p className="text-xs text-[#444651]">
                    Vietnamese format (0xxx or +84xxx)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="dob"
                  className="flex items-center gap-1.5 text-[#444651]"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Date of Birth
                </Label>
                <Input
                  id="dob"
                  type="date"
                  disabled={isLoading}
                  {...register("dob")}
                />
                {errors.dob && (
                  <p className="flex items-center gap-1 text-xs text-[#ba1a1a]">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.dob.message}
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-[#efeeec]" />

            {/* Bio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio" className="text-[#444651]">
                  Bio
                </Label>
                <span
                  className={cn(
                    "tabular-nums text-xs",
                    bioValue.length > 950
                      ? "font-medium text-[#ba1a1a]"
                      : "text-[#444651]"
                  )}
                >
                  {bioValue.length} / 1000
                </span>
              </div>
              <Textarea
                id="bio"
                placeholder="Tell others about yourself, your experience, or what you're working on..."
                rows={3}
                disabled={isLoading}
                {...register("bio")}
              />
              {errors.bio && (
                <p className="flex items-center gap-1 text-xs text-[#ba1a1a]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.bio.message}
                </p>
              )}
            </div>
          </div>

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
              className="bg-[#233a87] text-white hover:opacity-90"
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* ── Tab: Skills ── */}
      {activeTab === "skills" && <SkillsSection />}
    </motion.div>
  );
}
