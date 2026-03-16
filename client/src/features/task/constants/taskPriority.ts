import type { TaskPriority } from "@/types/api"

export const taskPriorityConfig: Record<
  TaskPriority,
  { label: string; className: string; iconClass: string }
> = {
  LOW: {
    label: "Low",
    className: "text-slate-400",
    iconClass: "text-slate-400",
  },
  MEDIUM: {
    label: "Medium",
    className: "text-amber-500",
    iconClass: "text-amber-500",
  },
  HIGH: {
    label: "High",
    className: "text-orange-500",
    iconClass: "text-orange-500",
  },
  URGENT: {
    label: "Urgent",
    className: "text-red-600 font-semibold",
    iconClass: "text-red-600",
  },
}
