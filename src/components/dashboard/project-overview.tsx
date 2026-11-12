"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ListTodo,
  type LucideIcon,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { ALL_SPRINTS } from "@/hooks/use-project-context";
import { computeStats } from "@/lib/task-utils";
import { daysBetween, formatShort, todayStr } from "@/lib/date-utils";
import type { Sprint } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectOverviewProps {
  projectId: string;
  sprintId: string | null;
  sprint: Sprint | null;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon
          className={cn(
            "size-4",
            tone === "danger" && value > 0
              ? "text-red-500"
              : "text-muted-foreground",
          )}
        />
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          tone === "danger" && value > 0 && "text-red-600 dark:text-red-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ProjectOverview({
  projectId,
  sprintId,
  sprint,
}: ProjectOverviewProps) {
  const allTasks = useAppSelector((s) => s.data.tasks);
  const columns = useAppSelector((s) => s.data.columns);

  const stats = useMemo(() => {
    const tasks = allTasks.filter(
      (t) =>
        t.projectId === projectId &&
        (sprintId === ALL_SPRINTS ||
          sprintId === null ||
          t.sprintId === sprintId),
    );
    return computeStats(tasks, columns, todayStr());
  }, [allTasks, columns, projectId, sprintId]);

  const today = todayStr();
  const daysLeft = sprint ? daysBetween(today, sprint.endDate) : null;

  return (
    <section aria-label="Project overview" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total tasks" value={stats.total} icon={ListTodo} />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          icon={CircleDot}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-sm font-medium">
              {sprint ? sprint.name : "All sprints"} progress
            </p>
            {sprint && (
              <p className="text-xs text-muted-foreground">
                {sprint.goal} · {formatShort(sprint.startDate)} –{" "}
                {formatShort(sprint.endDate)}
                {daysLeft !== null &&
                  (daysLeft >= 0 ? ` · ${daysLeft} days left` : " · ended")}
              </p>
            )}
          </div>
          <p className="text-sm font-semibold tabular-nums">
            {stats.completionPct}%
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stats.completionPct}
          aria-label="Sprint completion"
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${stats.completionPct}%` }}
          />
        </div>
      </div>
    </section>
  );
}
