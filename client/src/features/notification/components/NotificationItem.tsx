import { formatDistanceToNow } from "date-fns";
import {
  CheckSquare,
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  FolderPlus,
  MessageSquare,
  MessageCircle,
  SmilePlus,
  ShieldCheck,
  Bell,
  ClipboardCheck,
  Clock,
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
  TASK_ASSIGNED: <CheckSquare className="h-4 w-4 text-[#233a87]" />,
  TASK_UNASSIGNED: <UserMinus className="h-4 w-4 text-[#643300]" />,
  WORKSPACE_INVITE: <Users className="h-4 w-4 text-[#006a61]" />,
  WORKSPACE_INVITE_ACCEPT: <UserCheck className="h-4 w-4 text-[#006a61]" />,
  WORKSPACE_JOIN_REQUEST: <UserPlus className="h-4 w-4 text-[#233a87]" />,
  WORKSPACE_REVIEW_REQUEST: <ClipboardCheck className="h-4 w-4 text-[#006a61]" />,
  WORKSPACE_REMOVE_MEMBER: <UserMinus className="h-4 w-4 text-destructive" />,
  WORKSPACE_ROLE_CHANGE: <ShieldCheck className="h-4 w-4 text-[#643300]" />,
  PROJECT_JOIN_REQUEST: <FolderPlus className="h-4 w-4 text-[#233a87]" />,
  PROJECT_REVIEW_REQUEST: <ClipboardCheck className="h-4 w-4 text-[#006a61]" />,
  PROJECT_ADD_MEMBER: <UserPlus className="h-4 w-4 text-[#233a87]" />,
  PROJECT_REMOVE_MEMBER: <UserMinus className="h-4 w-4 text-destructive" />,
  PROJECT_ROLE_CHANGE: <ShieldCheck className="h-4 w-4 text-[#233a87]" />,
  COMMENT_MENTION: <MessageSquare className="h-4 w-4 text-[#643300]" />,
  COMMENT_REACTION: <SmilePlus className="h-4 w-4 text-[#006a61]" />,
  COMMENT_TASK: <MessageCircle className="h-4 w-4 text-[#233a87]" />,
  TASK_REMINDER: <Clock className="h-4 w-4 text-[#643300]" />,
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

  const timeAgo = (() => {
    const d = new Date(notification.createdAt);
    return isNaN(d.getTime())
      ? "just now"
      : formatDistanceToNow(d, { addSuffix: true });
  })();

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
