"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/shared/native-select";
import { useAppSelector } from "@/store/hooks";
import { ALL, workload } from "@/lib/dashboard-utils";
import { toCsv } from "@/lib/csv";
import { formatShort, todayStr } from "@/lib/date-utils";
import { downloadFile } from "@/lib/download";
import { sprintRows } from "@/lib/report-utils";
import { PRIORITY_META, STATUS_META } from "@/lib/task-meta";
import { isOverdue } from "@/lib/task-utils";

const th =
  "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-3 py-2.5 text-sm tabular-nums";

export function ReportsView() {
  const projects = useAppSelector((s) => s.data.projects);
  const sprints = useAppSelector((s) => s.data.sprints);
  const tasks = useAppSelector((s) => s.data.tasks);
  const columns = useAppSelector((s) => s.data.columns);
  const users = useAppSelector((s) => s.data.users);
  const labels = useAppSelector((s) => s.data.labels);
  const [projectId, setProjectId] = useState(ALL);
  const today = todayStr();

  const scopedTasks = useMemo(
    () => tasks.filter((t) => projectId === ALL || t.projectId === projectId),
    [tasks, projectId],
  );
  const rows = useMemo(
    () =>
      sprintRows(sprints, projects, tasks, columns, today).filter(
        (r) => projectId === ALL || r.projectId === projectId,
      ),
    [sprints, projects, tasks, columns, today, projectId],
  );
  const people = useMemo(
    () => workload(scopedTasks, users, columns),
    [scopedTasks, users, columns],
  );
  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      done: acc.done + r.done,
      overdue: acc.overdue + r.overdue,
      hours: acc.hours + r.hours,
    }),
    { total: 0, done: 0, overdue: 0, hours: 0 },
  );

  const exportTasks = () => {
    const projectName = new Map(projects.map((p) => [p.id, p.name] as const));
    const sprintName = new Map(sprints.map((s) => [s.id, s.name] as const));
    const columnById = new Map(columns.map((c) => [c.id, c] as const));
    const userName = new Map(users.map((u) => [u.id, u.name] as const));
    const labelName = new Map(labels.map((l) => [l.id, l.name] as const));
    const header = [
      "Project",
      "Sprint",
      "Title",
      "Status",
      "Priority",
      "Assignee",
      "Labels",
      "Start",
      "Due",
      "Est. hours",
      "Progress %",
      "Overdue",
    ];
    const body = scopedTasks.map((t) => {
      const col = columnById.get(t.columnId);
      return [
        projectName.get(t.projectId) ?? "",
        sprintName.get(t.sprintId) ?? "",
        t.title,
        col ? `${col.name} (${STATUS_META[col.statusKey].label})` : "",
        PRIORITY_META[t.priority].label,
        t.assigneeId ? (userName.get(t.assigneeId) ?? "") : "Unassigned",
        t.labelIds
          .map((id) => labelName.get(id) ?? "")
          .filter(Boolean)
          .join("; "),
        t.startDate,
        t.dueDate,
        t.estimatedHours,
        t.progress,
        isOverdue(t, columns, today) ? "Yes" : "No",
      ];
    });
    downloadFile(
      `sprintflow-tasks-${today}.csv`,
      toCsv([header, ...body]),
      "text/csv;charset=utf-8",
    );
  };

  const exportSprints = () => {
    const header = [
      "Project",
      "Sprint",
      "Start",
      "End",
      "Tasks",
      "Done",
      "Completion %",
      "Overdue",
      "Est. hours",
      "Done hours",
    ];
    const body = rows.map((r) => [
      r.project,
      r.name,
      r.start,
      r.end,
      r.total,
      r.done,
      r.pct,
      r.overdue,
      r.hours,
      r.doneHours,
    ]);
    downloadFile(
      `sprintflow-sprints-${today}.csv`,
      toCsv([header, ...body]),
      "text/csv;charset=utf-8",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Sprint summaries and team load. Export to CSV for Excel or Sheets.
          </p>
        </div>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Project
          <NativeSelect
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-44"
          >
            <option value={ALL}>All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={exportSprints}
          disabled={rows.length === 0}
        >
          <Download className="size-4" />
          Sprints CSV
        </Button>
        <Button
          size="sm"
          onClick={exportTasks}
          disabled={scopedTasks.length === 0}
        >
          <Download className="size-4" />
          Tasks CSV
        </Button>
      </div>

      <section
        aria-label="Sprint summary"
        className="animate-row-in overflow-hidden rounded-2xl border bg-card"
      >
        <h2 className="border-b px-4 py-3 text-sm font-semibold">
          Sprint summary
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className={th}>Sprint</th>
                <th className={th}>Dates</th>
                <th className={th}>Tasks</th>
                <th className={th}>Completion</th>
                <th className={th}>Overdue</th>
                <th className={th}>Hours (done / est.)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2.5 text-sm">
                    <span className="font-medium">{r.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {r.project}
                    </span>
                  </td>
                  <td className={`${td} text-muted-foreground`}>
                    {formatShort(r.start)} – {formatShort(r.end)}
                  </td>
                  <td className={td}>
                    {r.done}/{r.total}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full bg-emerald-500"
                          style={{ width: `${r.pct}%` }}
                        />
                      </span>
                      <span className="text-sm tabular-nums">{r.pct}%</span>
                    </span>
                  </td>
                  <td
                    className={`${td} ${r.overdue > 0 ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
                  >
                    {r.overdue}
                  </td>
                  <td className={td}>
                    {r.doneHours} / {r.hours}h
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30 font-medium">
                <td className="px-3 py-2.5 text-sm" colSpan={2}>
                  Total
                </td>
                <td className={td}>
                  {totals.done}/{totals.total}
                </td>
                <td className={td}>
                  {totals.total === 0
                    ? 0
                    : Math.round((totals.done / totals.total) * 100)}
                  %
                </td>
                <td className={td}>{totals.overdue}</td>
                <td className={td}>{totals.hours}h</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section
        aria-label="Team load"
        className="animate-row-in overflow-hidden rounded-2xl border bg-card"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Team load</h2>
        {people.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No tasks in this scope.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className={th}>Person</th>
                <th className={th}>Open</th>
                <th className={th}>Done</th>
                <th className={th}>Open hours</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2.5 text-sm font-medium">{p.name}</td>
                  <td className={td}>{p.open}</td>
                  <td className={td}>{p.done}</td>
                  <td className={td}>{p.hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
