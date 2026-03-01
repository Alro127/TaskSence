import { useState } from "react";
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

const profileEditSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9+\-\s()]+$/.test(val),
      "Invalid phone number format"
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dob: z.string().optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
});

type ProfileEditFormData = z.infer<typeof profileEditSchema>;

export function EditProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.currentUser);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    try {
      const payload = {
        fullName: data.fullName,
        phone: data.phone || null,
        gender: data.gender || null,
        dob: data.dob || null,
        bio: data.bio || null,
      };

      console.log("Update profile with:", payload);
      dispatch(updateCurrentUser(payload));

      toast.success("Profile updated successfully!", {
        description: "Your changes have been saved.",
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error("Failed to update profile", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="e.g., John Doe"
                disabled={isSubmitting}
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
                placeholder="e.g., +1 (234) 567-8900"
                disabled={isSubmitting}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                rows={4}
                {...register("bio")}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum 500 characters
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
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
