"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  LayoutDashboard,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { NativeSelect } from "@/components/shared/native-select";
import { ActivityFeed } from "./activity-feed";
import { ChartCard } from "./chart-card";
import { DeadlinesList } from "./deadlines-list";
import { PriorityChart } from "./priority-chart";
import { StatCard } from "./project-overview";
import { StatusChart } from "./status-chart";
import { WorkloadChart } from "./workload-chart";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openTask } from "@/store/slices/ui-slice";
import {
  ALL,
  defaultSprintId,
  priorityDistribution,
  statusDistribution,
  upcomingDeadlines,
  workload,
} from "@/lib/dashboard-utils";
import { daysBetween, formatShort, todayStr } from "@/lib/date-utils";
import { computeStats } from "@/lib/task-utils";

export function DashboardView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const projects = useAppSelector((s) => s.data.projects);
  const allSprints = useAppSelector((s) => s.data.sprints);
  const tasks = useAppSelector((s) => s.data.tasks);
  const columns = useAppSelector((s) => s.data.columns);
  const users = useAppSelector((s) => s.data.users);
  const activities = useAppSelector((s) => s.data.activities);

  const today = todayStr();

  /* ---------- scope from the URL ---------- */
  const projectParam = params.get("project");
  const projectId = projects.some((p) => p.id === projectParam)
    ? (projectParam as string)
    : ALL;

  const sprints = useMemo(
    () =>
      allSprints
        .filter((s) => s.projectId === projectId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [allSprints, projectId],
  );
  const sprintParam = params.get("sprint");
  const sprintId =
    projectId === ALL
      ? ALL
      : sprintParam === ALL || sprints.some((s) => s.id === sprintParam)
        ? (sprintParam as string)
        : (defaultSprintId(sprints, today) ?? ALL);
  const sprint = sprints.find((s) => s.id === sprintId) ?? null;

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  /* ---------- everything below is computed from the store ---------- */
  const scoped = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (projectId === ALL || t.projectId === projectId) &&
          (sprintId === ALL || t.sprintId === sprintId),
      ),
    [tasks, projectId, sprintId],
  );

  const stats = useMemo(
    () => computeStats(scoped, columns, today),
    [scoped, columns, today],
  );
  const statusData = useMemo(
    () => statusDistribution(scoped, columns),
    [scoped, columns],
  );
  const priorityData = useMemo(() => priorityDistribution(scoped), [scoped]);
  const workloadRows = useMemo(
    () => workload(scoped, users, columns),
    [scoped, users, columns],
  );
  const deadlines = useMemo(
    () => upcomingDeadlines(scoped, columns, today),
    [scoped, columns, today],
  );

  const userById = useMemo(
    () => new Map(users.map((u) => [u.id, u] as const)),
    [users],
  );
  const existingTaskIds = useMemo(
    () => new Set(tasks.map((t) => t.id)),
    [tasks],
  );
  const feed = useMemo(() => {
    const ids = new Set(scoped.map((t) => t.id));
    const list =
      projectId === ALL && sprintId === ALL
        ? activities
        : activities.filter((a) => ids.has(a.taskId));
    return list.slice(0, 8);
  }, [activities, scoped, projectId, sprintId]);

  const daysLeft = sprint ? daysBetween(today, sprint.endDate) : null;
  const open = (id: string) => dispatch(openTask(id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live numbers from your tasks. They change as you work.
          </p>
        </div>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Project
          <NativeSelect
            value={projectId}
            onChange={(e) =>
              setParams({
                project: e.target.value === ALL ? null : e.target.value,
                sprint: null,
              })
            }
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
        {projectId !== ALL && sprints.length > 0 && (
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Sprint
            <NativeSelect
              value={sprintId}
              onChange={(e) => setParams({ sprint: e.target.value })}
              className="w-40"
            >
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value={ALL}>All sprints</option>
            </NativeSelect>
          </label>
        )}
      </div>

      {scoped.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title="No tasks in this scope"
          description="Pick another project or sprint, or create a task to see the numbers move."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setParams({ project: null, sprint: null })}
            >
              Show all projects
            </Button>
          }
        />
      ) : (
        <>
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

          <section
            aria-label="Completion"
            className="animate-row-in rounded-2xl border bg-card p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {sprint ? `${sprint.name} completion` : "Overall completion"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sprint
                    ? `${sprint.goal} · ${formatShort(sprint.startDate)} – ${formatShort(sprint.endDate)}${
                        daysLeft !== null
                          ? daysLeft >= 0
                            ? ` · ${daysLeft} days left`
                            : " · ended"
                          : ""
                      }`
                    : `${stats.completed} of ${stats.total} tasks done`}
                </p>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {stats.completionPct}%
              </p>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={stats.completionPct}
              aria-label="Completion"
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-[width] duration-700"
                style={{ width: `${stats.completionPct}%` }}
              />
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ChartCard
              title="Tasks by status"
              description="Based on each task's column"
              delay={60}
            >
              <StatusChart data={statusData} />
            </ChartCard>
            <ChartCard
              title="Priority mix"
              description="How urgent the work is"
              delay={120}
            >
              <PriorityChart data={priorityData} />
            </ChartCard>
            <ChartCard
              title="Team workload"
              description="Open versus finished tasks per person"
              delay={180}
              className="md:col-span-2 xl:col-span-1"
            >
              <WorkloadChart rows={workloadRows} />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Upcoming deadlines"
              description="Overdue, plus the next 7 days"
              delay={240}
            >
              <DeadlinesList
                items={deadlines.items}
                total={deadlines.total}
                userById={userById}
                onOpen={open}
              />
            </ChartCard>
            <ChartCard
              title="Recent activity"
              description="Newest changes first"
              delay={300}
            >
              <ActivityFeed
                items={feed}
                userById={userById}
                existingTaskIds={existingTaskIds}
                onOpen={open}
              />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
