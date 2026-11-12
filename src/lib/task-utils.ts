import type { Column, StatusKey, Task } from "@/types";

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionPct: number; // 0-100
}

/** A task's status always comes from its column. */
export function statusOf(task: Task, columns: Column[]): StatusKey | undefined {
  return columns.find((c) => c.id === task.columnId)?.statusKey;
}

export function isOverdue(
  task: Task,
  columns: Column[],
  today: string,
): boolean {
  return (
    task.dueDate !== null &&
    task.dueDate < today &&
    statusOf(task, columns) !== "done"
  );
}

export function computeStats(
  tasks: Task[],
  columns: Column[],
  today: string,
): TaskStats {
  let completed = 0;
  let inProgress = 0;
  let overdue = 0;

  for (const task of tasks) {
    const status = statusOf(task, columns);
    if (status === "done") completed += 1;
    if (status === "in_progress") inProgress += 1;
    if (isOverdue(task, columns, today)) overdue += 1;
  }

  const total = tasks.length;
  return {
    total,
    completed,
    inProgress,
    overdue,
    completionPct: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
