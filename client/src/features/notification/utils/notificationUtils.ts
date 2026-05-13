import type { NotificationResponse, NotificationType } from "@/types/api";

interface NotificationText {
  title: string;
  description: string;
}

/**
 * Returns human-readable title & description for a notification.
 * Uses the `payload` field for dynamic content (actor name, task name, etc.)
 */
export function getNotificationText(
  notification: NotificationResponse
): NotificationText {
  const payload = notification.payload ?? {};
  // Backend uses `sender` for actor name, fallback to `actorName` for other types
  const actorName =
    (payload.sender as string | undefined) ??
    (payload.actorName as string | undefined) ??
    "Someone";
  // Backend uses `referenceName` as the generic entity name
  const referenceName = (payload.referenceName as string | undefined) ?? "";
  const taskName = (payload.taskName as string | undefined) ?? (referenceName !== "" ? referenceName : "a task");
  const workspaceName = referenceName !== "" ? referenceName : ((payload.workspaceName as string | undefined) ?? "a workspace");
  const projectName = referenceName !== "" ? referenceName : ((payload.projectName as string | undefined) ?? "a project");
  const newRole = (payload.newRole as string | undefined) ?? "a new role";

  const map: Record<NotificationType, NotificationText> = {
    TASK_ASSIGNED: {
      title: "New task assigned",
      description: `${actorName} assigned you to "${taskName}"`,
    },
    TASK_UNASSIGNED: {
      title: "Unassigned from task",
      description: `${actorName} removed you from "${taskName}"`,
    },
    WORKSPACE_INVITE: {
      title: "Workspace invitation",
      description: `${actorName} invited you to join "${workspaceName}"`,
    },
    WORKSPACE_INVITE_ACCEPT: {
      title: "Invitation accepted",
      description: `${actorName} accepted your invitation to "${workspaceName}"`,
    },
    WORKSPACE_JOIN_REQUEST: {
      title: "Join request",
      description: `${actorName} requested to join "${workspaceName}"`,
    },
    WORKSPACE_REVIEW_REQUEST: {
      title: notification.referenceId
        ? "Join request approved"
        : "Join request rejected",
      description: notification.referenceId
        ? `Your request to join "${workspaceName}" was approved`
        : `Your request to join "${workspaceName}" was rejected`,
    },
    WORKSPACE_REMOVE_MEMBER: {
      title: "Removed from workspace",
      description: `You have been removed from "${workspaceName}"`,
    },
    WORKSPACE_ROLE_CHANGE: {
      title: "Role changed",
      description: `Your role in "${workspaceName}" has been updated to ${newRole}`,
    },
    WORKSPACE_LEAVE: {
      title: "Member left workspace",
      description: `${actorName} left "${workspaceName}"`,
    },
    PROJECT_JOIN_REQUEST: {
      title: "Project join request",
      description: `${actorName} requested to join "${projectName}"`,
    },
    PROJECT_REVIEW_REQUEST: {
      title: notification.referenceId
        ? "Join request approved"
        : "Join request rejected",
      description: notification.referenceId
        ? `Your request to join "${projectName}" was approved`
        : `Your request to join "${projectName}" was rejected`,
    },
    PROJECT_ADD_MEMBER: {
      title: "Added to project",
      description: `${actorName} added you to "${projectName}"`,
    },
    PROJECT_REMOVE_MEMBER: {
      title: "Removed from project",
      description: `You have been removed from "${projectName}"`,
    },
    PROJECT_ROLE_CHANGE: {
      title: "Project role changed",
      description: `Your role in "${projectName}" has been updated to ${newRole}`,
    },
    PROJECT_LEAVE: {
      title: "Member left project",
      description: `${actorName} left "${projectName}"`,
    },
    COMMENT_MENTION: {
      title: "You were mentioned",
      description: `${actorName} mentioned you in a comment`,
    },
    COMMENT_REACTION: {
      title: "New reaction",
      description: `${actorName} reacted to your comment`,
    },
    COMMENT_TASK: {
      title: "New comment",
      description: `${actorName} commented on "${taskName}"`,
    },
    TASK_REMINDER: {
      title: "Task reminder",
      description: `Reminder: "${taskName}" is due soon`,
    },
  };

  return map[notification.type] ?? { title: "New notification", description: "" };
}

/**
 * Returns the destination path to navigate when the notification is clicked.
 * Adjust routes once task/project pages are available.
 */
export function getNotificationTarget(notification: NotificationResponse): string | null {
  const payload = notification.payload ?? {};

  switch (notification.type) {
    case "TASK_ASSIGNED":
    case "TASK_UNASSIGNED": {
      const workspaceId = payload.workspaceId as number | undefined;
      const projectId = payload.projectId as number | undefined;
      const taskId = notification.referenceId;
      return workspaceId && projectId && taskId
        ? `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
        : "/tasks";
    }
    case "WORKSPACE_INVITE": {
      const token = payload.token as string | undefined;
      return token
        ? `/workspaces/invitation?token=${encodeURIComponent(token)}`
        : "/workspaces";
    }
    case "WORKSPACE_INVITE_ACCEPT": {
      const workspaceId =
        notification.referenceId ??
        (payload.workspaceId as number | undefined);
      return workspaceId ? `/workspaces/${workspaceId}` : "/workspaces";
    }
    case "WORKSPACE_JOIN_REQUEST": {
      const workspaceId =
        notification.referenceId ??
        (payload.workspaceId as number | undefined);
      // Navigate to members tab so owner can review directly
      return workspaceId ? `/workspaces/${workspaceId}?tab=members` : "/workspaces";
    }
    case "WORKSPACE_REVIEW_REQUEST": {
      // referenceId is set only when APPROVED (backend sets it conditionally)
      const workspaceId = notification.referenceId;
      return workspaceId ? `/workspaces/${workspaceId}` : "/workspaces";
    }
    case "WORKSPACE_REMOVE_MEMBER": {
      return "/workspaces";
    }
    case "WORKSPACE_LEAVE": {
      const workspaceId = notification.referenceId;
      return workspaceId ? `/workspaces/${workspaceId}?tab=members` : "/workspaces";
    }
    case "WORKSPACE_ROLE_CHANGE": {
      const workspaceId = notification.referenceId ?? (payload.workspaceId as number | undefined);
      return workspaceId ? `/workspaces/${workspaceId}` : "/workspaces";
    }
    case "PROJECT_JOIN_REQUEST": {
      const workspaceId = payload.workspaceId as number | undefined;
      return workspaceId ? `/workspaces/${workspaceId}` : "/workspaces";
    }
    case "PROJECT_REVIEW_REQUEST": {
      const workspaceId = payload.workspaceId as number | undefined;
      const projectId = notification.referenceId;
      return workspaceId && projectId
        ? `/workspaces/${workspaceId}/projects/${projectId}`
        : "/workspaces";
    }
    case "PROJECT_ADD_MEMBER": {
      const workspaceId = payload.workspaceId as number | undefined;
      const projectId = notification.referenceId;
      return workspaceId && projectId
        ? `/workspaces/${workspaceId}/projects/${projectId}`
        : "/workspaces";
    }
    case "PROJECT_REMOVE_MEMBER": {
      return "/workspaces";
    }
    case "PROJECT_LEAVE": {
      const workspaceId = payload.workspaceId as number | undefined;
      const projectId = notification.referenceId;
      return workspaceId && projectId
        ? `/workspaces/${workspaceId}/projects/${projectId}`
        : "/workspaces";
    }
    case "PROJECT_ROLE_CHANGE": {
      const workspaceId = payload.workspaceId as number | undefined;
      const projectId = notification.referenceId;
      return workspaceId && projectId
        ? `/workspaces/${workspaceId}/projects/${projectId}`
        : "/workspaces";
    }
    case "COMMENT_MENTION":
    case "COMMENT_REACTION":
    case "COMMENT_TASK": {
      const workspaceId = payload.workspaceId as number | undefined;
      const projectId = payload.projectId as number | undefined;
      const taskId = payload.taskId as number | undefined;
      // referenceId is the comment ID for all comment notification types
      const commentId = notification.referenceId;
      if (!workspaceId || !projectId || !taskId) return "/tasks";
      const base = `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`;
      return commentId ? `${base}?commentId=${commentId}` : base;
    }
    case "TASK_REMINDER": {
      const workspaceId = payload.workspaceId as number | undefined;
      const projectId = payload.projectId as number | undefined;
      const taskId = notification.referenceId;
      return workspaceId && projectId && taskId
        ? `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
        : "/tasks";
    }
    default:
      return null;
  }
}
