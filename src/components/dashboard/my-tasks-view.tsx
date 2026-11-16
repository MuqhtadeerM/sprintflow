"use client";

import { useMemo } from "react";
import { PartyPopper } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openTask } from "@/store/slices/ui-slice";
import { shiftDate } from "@/lib/calendar-utils";
import { describeDue, todayStr } from "@/lib/date-utils";
import { isOverdue } from "@/lib/task-utils";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

const byDue = (a: Task, b: Task) =>
  (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.order - b.order;

export function MyTasksView() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((s) => s.data.tasks);
  const columns = useAppSelector((s) => s.data.columns);
  const projects = useAppSelector((s) => s.data.projects);
  const me = useAppSelector((s) => s.data.currentUserId);
  const today = todayStr();

  const groups = useMemo(() => {
    const columnById = new Map(columns.map((c) => [c.id, c] as const));
    const mine = tasks.filter((t) => t.assigneeId === me);
    const isDone = (t: Task) =>
      columnById.get(t.columnId)?.statusKey === "done";
    const open = mine.filter((t) => !isDone(t));
    const weekEnd = shiftDate(today, 7);
    return [
      {
        title: "Overdue",
        tone: "text-red-600 dark:text-red-400",
        items: open.filter((t) => isOverdue(t, columns, today)).sort(byDue),
      },
      {
        title: "This week",
        tone: "",
        items: open
          .filter(
            (t) =>
              t.dueDate !== null && t.dueDate >= today && t.dueDate <= weekEnd,
          )
          .sort(byDue),
      },
      {
        title: "Later",
        tone: "",
        items: open
          .filter((t) => t.dueDate === null || t.dueDate > weekEnd)
          .sort(byDue),
      },
      {
        title: "Done",
        tone: "text-muted-foreground",
        items: mine.filter(isDone).sort(byDue),
      },
    ];
  }, [tasks, columns, me, today]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const projectById = new Map(projects.map((p) => [p.id, p] as const));
  const columnById = new Map(columns.map((c) => [c.id, c] as const));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My tasks</h1>
        <p className="text-sm text-muted-foreground">
          Everything assigned to you, across all projects.
        </p>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="Nothing assigned to you"
          description="Tasks assigned to you will appear here, grouped by urgency."
        />
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.title} aria-label={g.title} className="space-y-2">
              <h2
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  g.tone || "text-muted-foreground",
                )}
              >
                {g.title} · {g.items.length}
              </h2>
              <ul className="divide-y rounded-2xl border bg-card">
                {g.items.map((t) => {
                  const column = columnById.get(t.columnId);
                  const project = projectById.get(t.projectId);
                  const due = t.dueDate
                    ? describeDue(t.dueDate, g.title === "Done")
                    : null;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => dispatch(openTask(t.id))}
                        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left outline-none transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: project?.color }}
                          title={project?.name}
                        />
                        <span
                          className={cn(
                            "min-w-0 flex-1 basis-40 truncate text-sm font-medium",
                            g.title === "Done" &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {t.title}
                        </span>
                        {column && (
                          <StatusBadge
                            statusKey={column.statusKey}
                            label={column.name}
                          />
                        )}
                        <PriorityIndicator
                          priority={t.priority}
                          showLabel={false}
                        />
                        {due && (
                          <span
                            className={cn(
                              "w-20 text-right text-xs tabular-nums text-muted-foreground",
                              due.tone === "overdue" &&
                                "font-medium text-red-600 dark:text-red-400",
                              due.tone === "soon" &&
                                "font-medium text-amber-600 dark:text-amber-400",
                            )}
                          >
                            {due.text}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}
