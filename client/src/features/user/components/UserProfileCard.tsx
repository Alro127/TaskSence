import { format } from "date-fns";
import { User as UserIcon, Mail, Phone, Calendar, Users2, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/api";

interface UserProfileCardProps {
  user: User | null;
  isLoading?: boolean;
  onEditClick?: () => void;
}

export function UserProfileCard({
  user,
  isLoading = false,
  onEditClick,
}: UserProfileCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex gap-6">
            <div className="h-20 w-20 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-48 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No user data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName || "User"}
              className="h-24 w-24 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted">
              <UserIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 space-y-4">
          {/* Name & Email */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {user.fullName || "User"}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Phone */}
            {user.phone && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone
                </div>
                <p className="text-sm font-medium">{user.phone}</p>
              </div>
            )}

            {/* Gender */}
            {user.gender && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                  Gender
                </div>
                <p className="text-sm font-medium capitalize">{user.gender}</p>
              </div>
            )}

            {/* Date of Birth */}
            {user.dob && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(user.dob), "MMM dd, yyyy")}
                </p>
              </div>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Bio
              </div>
              <p className="text-sm leading-relaxed text-foreground">{user.bio}</p>
            </div>
          )}

          {/* Edit Button */}
          {onEditClick && (
            <div className="border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
              >
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
