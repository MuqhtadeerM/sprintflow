import type { Priority, StatusKey } from "@/types";

export const PRIORITY_META: Record<
  Priority,
  { label: string; rank: number; bars: number; color: string }
> = {
  low: { label: "Low", rank: 1, bars: 1, color: "#64748b" },
  medium: { label: "Medium", rank: 2, bars: 2, color: "#3b82f6" },
  high: { label: "High", rank: 3, bars: 3, color: "#f59e0b" },
  urgent: { label: "Urgent", rank: 4, bars: 4, color: "#ef4444" },
};

export const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];

export const STATUS_META: Record<StatusKey, { label: string; color: string }> =
  {
    backlog: { label: "Backlog", color: "#94a3b8" },
    todo: { label: "To Do", color: "#6366f1" },
    in_progress: { label: "In Progress", color: "#f59e0b" },
    review: { label: "In Review", color: "#a855f7" },
    done: { label: "Done", color: "#10b981" },
  };
