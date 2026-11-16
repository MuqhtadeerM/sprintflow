import { shiftDate } from "./calendar-utils";
import { PRIORITIES, PRIORITY_META, STATUS_META } from "./task-meta";
import type { Column, Sprint, StatusKey, Task, User } from "@/types";

export const ALL = "all";

const STATUS_ORDER: StatusKey[] = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
];

export interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function statusDistribution(tasks: Task[], columns: Column[]): Slice[] {
  const statusByColumn = new Map(
    columns.map((c) => [c.id, c.statusKey] as const),
  );
  const counts = new Map<StatusKey, number>();
  for (const t of tasks) {
    const s = statusByColumn.get(t.columnId);
    if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return STATUS_ORDER.map((key) => ({
    key,
    label: STATUS_META[key].label,
    value: counts.get(key) ?? 0,
    color: STATUS_META[key].color,
  }));
}

export function priorityDistribution(tasks: Task[]): Slice[] {
  return PRIORITIES.map((p) => ({
    key: p,
    label: PRIORITY_META[p].label,
    value: tasks.filter((t) => t.priority === p).length,
    color: PRIORITY_META[p].color,
  }));
}

export interface WorkloadRow {
  id: string;
  name: string;
  color: string;
  open: number;
  done: number;
  hours: number; // estimated hours still open
}

export function workload(
  tasks: Task[],
  users: User[],
  columns: Column[],
): WorkloadRow[] {
  const doneColumns = new Set(
    columns.filter((c) => c.statusKey === "done").map((c) => c.id),
  );
  const rows = new Map<string, WorkloadRow>(
    users.map((u) => [
      u.id,
      {
        id: u.id,
        name: u.name.split(" ")[0],
        color: u.avatarColor,
        open: 0,
        done: 0,
        hours: 0,
      },
    ]),
  );
  const unassigned: WorkloadRow = {
    id: "unassigned",
    name: "Unassigned",
    color: "#94a3b8",
    open: 0,
    done: 0,
    hours: 0,
  };

  for (const t of tasks) {
    const target = t.assigneeId ? rows.get(t.assigneeId) : unassigned;
    if (!target) continue;
    if (doneColumns.has(t.columnId)) target.done += 1;
    else {
      target.open += 1;
      target.hours += t.estimatedHours;
    }
  }
  return [...rows.values(), unassigned]
    .filter((r) => r.open + r.done > 0)
    .sort((a, b) => b.open - a.open || b.done - a.done);
}

/** Open tasks that are overdue or due within `horizon` days, soonest first. */
export function upcomingDeadlines(
  tasks: Task[],
  columns: Column[],
  today: string,
  horizon = 7,
  limit = 8,
): { items: Task[]; total: number } {
  const doneColumns = new Set(
    columns.filter((c) => c.statusKey === "done").map((c) => c.id),
  );
  const end = shiftDate(today, horizon);
  const all = tasks
    .filter(
      (t) =>
        t.dueDate !== null && t.dueDate <= end && !doneColumns.has(t.columnId),
    )
    .sort(
      (a, b) =>
        (a.dueDate ?? "").localeCompare(b.dueDate ?? "") ||
        PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank,
    );
  return { items: all.slice(0, limit), total: all.length };
}

/** The sprint running today, otherwise the most recent one. */
export function defaultSprintId(
  sprints: Sprint[],
  today: string,
): string | null {
  if (sprints.length === 0) return null;
  const sorted = [...sprints].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const current = sorted.find(
    (s) => s.startDate <= today && today <= s.endDate,
  );
  return (current ?? sorted[sorted.length - 1]).id;
}
