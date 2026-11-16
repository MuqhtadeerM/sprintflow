import { shiftDate } from "./calendar-utils";
import type { Column, Project, Task } from "@/types";

export type NotificationKind = "overdue" | "wip" | "due_today" | "due_soon";

export interface AppNotification {
  id: string; // includes the date or count, so a changed situation notifies again
  kind: NotificationKind;
  title: string;
  detail: string;
  taskId?: string;
  projectId?: string;
}

const ORDER: Record<NotificationKind, number> = {
  overdue: 0,
  wip: 1,
  due_today: 2,
  due_soon: 3,
};

export function buildNotifications(
  tasks: Task[],
  columns: Column[],
  projects: Project[],
  me: string,
  today: string,
): AppNotification[] {
  const columnById = new Map(columns.map((c) => [c.id, c] as const));
  const projectName = new Map(projects.map((p) => [p.id, p.name] as const));
  const tomorrow = shiftDate(today, 1);
  const out: AppNotification[] = [];

  for (const t of tasks) {
    if (t.assigneeId !== me || !t.dueDate) continue;
    if (columnById.get(t.columnId)?.statusKey === "done") continue;
    const where = projectName.get(t.projectId) ?? "";
    const base = { taskId: t.id, projectId: t.projectId, title: t.title };
    if (t.dueDate < today) {
      out.push({
        ...base,
        id: `overdue:${t.id}:${t.dueDate}`,
        kind: "overdue",
        detail: `Overdue since ${t.dueDate} · ${where}`,
      });
    } else if (t.dueDate === today) {
      out.push({
        ...base,
        id: `today:${t.id}`,
        kind: "due_today",
        detail: `Due today · ${where}`,
      });
    } else if (t.dueDate === tomorrow) {
      out.push({
        ...base,
        id: `soon:${t.id}`,
        kind: "due_soon",
        detail: `Due tomorrow · ${where}`,
      });
    }
  }

  const counts = new Map<string, number>();
  for (const t of tasks)
    counts.set(t.columnId, (counts.get(t.columnId) ?? 0) + 1);
  for (const c of columns) {
    const count = counts.get(c.id) ?? 0;
    if (c.wipLimit !== null && count > c.wipLimit) {
      out.push({
        id: `wip:${c.id}:${count}:${c.wipLimit}`,
        kind: "wip",
        projectId: c.projectId,
        title: `“${c.name}” is over its WIP limit`,
        detail: `${count} tasks, limit ${c.wipLimit} · ${projectName.get(c.projectId) ?? ""}`,
      });
    }
  }

  return out.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]).slice(0, 30);
}
