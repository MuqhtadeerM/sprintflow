import { isOverdue } from "./task-utils";
import type { Column, Project, Sprint, Task } from "@/types";

export interface SprintRow {
  id: string;
  projectId: string;
  project: string;
  name: string;
  start: string;
  end: string;
  total: number;
  done: number;
  pct: number;
  overdue: number;
  hours: number;
  doneHours: number;
}

export function sprintRows(
  sprints: Sprint[],
  projects: Project[],
  tasks: Task[],
  columns: Column[],
  today: string,
): SprintRow[] {
  const projectName = new Map(projects.map((p) => [p.id, p.name] as const));
  const doneColumns = new Set(
    columns.filter((c) => c.statusKey === "done").map((c) => c.id),
  );

  return sprints
    .map((s) => {
      const list = tasks.filter((t) => t.sprintId === s.id);
      const done = list.filter((t) => doneColumns.has(t.columnId));
      return {
        id: s.id,
        projectId: s.projectId,
        project: projectName.get(s.projectId) ?? "",
        name: s.name,
        start: s.startDate,
        end: s.endDate,
        total: list.length,
        done: done.length,
        pct:
          list.length === 0 ? 0 : Math.round((done.length / list.length) * 100),
        overdue: list.filter((t) => isOverdue(t, columns, today)).length,
        hours: list.reduce((sum, t) => sum + t.estimatedHours, 0),
        doneHours: done.reduce((sum, t) => sum + t.estimatedHours, 0),
      };
    })
    .sort(
      (a, b) =>
        a.project.localeCompare(b.project) || a.start.localeCompare(b.start),
    );
}
