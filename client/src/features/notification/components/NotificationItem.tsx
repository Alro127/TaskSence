import { formatDistanceToNow } from "date-fns";
import {
  CheckSquare,
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  FolderPlus,
  MessageSquare,
  ShieldCheck,
  Bell,
} from "lucide-react";
import type { NotificationResponse, NotificationType } from "@/types/api";
import { getNotificationText } from "../utils/notificationUtils";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: NotificationResponse;
  onClick: (notification: NotificationResponse) => void;
  onDelete: (id: number) => void;
}

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  TASK_ASSIGNED: <CheckSquare className="h-4 w-4 text-blue-500" />,
  WORKSPACE_INVITE: <Users className="h-4 w-4 text-green-500" />,
  WORKSPACE_INVITE_ACCEPT: <UserCheck className="h-4 w-4 text-green-500" />,
  WORKSPACE_JOIN_REQUEST: <UserPlus className="h-4 w-4 text-cyan-500" />,
  WORKSPACE_REMOVE_MEMBER: <UserMinus className="h-4 w-4 text-destructive" />,
  WORKSPACE_ROLE_CHANGE: <ShieldCheck className="h-4 w-4 text-amber-500" />,
  PROJECT_JOIN_REQUEST: <FolderPlus className="h-4 w-4 text-cyan-500" />,
  COMMENT_MENTION: <MessageSquare className="h-4 w-4 text-amber-500" />,
  PROJECT_ROLE_UPDATED: <ShieldCheck className="h-4 w-4 text-purple-500" />,
};

export function NotificationItem({
  notification,
  onClick,
  onDelete,
}: NotificationItemProps) {
  const { title, description } = getNotificationText(notification);
  const icon = TYPE_ICON[notification.type] ?? (
    <Bell className="h-4 w-4 text-muted-foreground" />
  );

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer gap-3 rounded-md px-3 py-3 transition-colors hover:bg-muted",
        !notification.read && "bg-primary/5"
      )}
      onClick={() => onClick(notification)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(notification)}
    >
      {/* Unread dot */}
      {!notification.read && (
        <span className="absolute left-1 top-4 h-1.5 w-1.5 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            notification.read ? "text-muted-foreground" : "font-medium text-foreground"
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {description}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">{timeAgo}</p>
      </div>

      {/* Delete button — visible on hover */}
      <button
        className="absolute right-2 top-2 hidden rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:flex"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        aria-label="Delete notification"
        title="Delete"
      >
        <span className="text-xs">✕</span>
      </button>
    </div>
  );
}
