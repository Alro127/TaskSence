import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { updateCurrentUser } from "@/features/user/userSlice";
import { useUpdateUserProfileMutation } from "@/features/user/api/userApi";
import { AvatarUpload } from "@/features/user/components";
import { useAvatarUpload } from "@/features/user/hooks/useAvatarUpload";

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
      "Phone must be a valid Vietnamese number (e.g., 0123456789 or +84123456789)"
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dob: z.string().optional(),
  bio: z.string().max(1000, "Bio must be at most 1000 characters").optional(),
});

type ProfileEditFormData = z.infer<typeof profileEditSchema>;

export function EditProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.currentUser);
  const [updateUserProfile, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation();
  
  const { selectedFile, uploadAvatarToS3, isUploading: isUploadingAvatar, clearPreview, previewUrl, validateAndPreview } = useAvatarUpload();

  const {
    register,
    handleSubmit,
    formState: { errors },
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

  const onSubmit = async (data: ProfileEditFormData) => {
    try {
      const payload: any = {
        fullName: data.fullName || undefined,
        phone: data.phone || undefined,
        gender: data.gender || undefined,
        dob: data.dob || undefined,
        bio: data.bio || undefined,
      };

      console.log(selectedFile)
      // If user selected a new avatar, upload it to S3 first
      if (selectedFile) {
        try {
          const fileUrl = await uploadAvatarToS3();
          if (fileUrl) {
            payload.avatarUrl = fileUrl;
          }
        } catch (error) {
          toast.error("Avatar upload failed", {
            description: "Failed to upload avatar. Please try again.",
          });
          return;
        }
      }

      const response = await updateUserProfile(payload).unwrap();

      // Update Redux store with response data
      dispatch(updateCurrentUser(response.data));

      // Clear avatar preview after successful save
      clearPreview();

      toast.success("Profile updated successfully!", {
        description: response.message || "Your changes have been saved.",
      });

      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      const apiError = error as { data?: { message?: string } };
      toast.error("Failed to update profile", {
        description:
          apiError?.data?.message ||
          "Something went wrong. Please try again.",
      });
    }
  };

  const isLoading = isUpdating || isUploadingAvatar;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Edit profile</h2>
          <p className="text-sm text-muted-foreground">
            Update your personal information
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
              <AvatarUpload
                currentAvatarUrl={user?.avatarUrl}
                userName={user?.fullName || "User"}
                previewUrl={previewUrl}
                validateAndPreview={validateAndPreview}
                clearPreview={clearPreview}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (read-only)</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed for security reasons
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="e.g., John Doe"
                disabled={isLoading}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 0123456789 or +84123456789"
                disabled={isLoading}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Vietnamese numbers only (0xxx or +84xxx format)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                disabled={isLoading}
                {...register("gender")}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.gender && (
                <p className="text-sm text-destructive">{errors.gender.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                disabled={isLoading}
                {...register("dob")}
              />
              {errors.dob && (
                <p className="text-sm text-destructive">{errors.dob.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                placeholder="Tell us about yourself..."
                disabled={isLoading}
                rows={4}
                {...register("bio")}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum 1000 characters
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
