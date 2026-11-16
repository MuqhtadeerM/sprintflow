"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { todayStr } from "@/lib/date-utils";
import { computeStats } from "@/lib/task-utils";

export function ProjectsView() {
  const projects = useAppSelector((s) => s.data.projects);
  const tasks = useAppSelector((s) => s.data.tasks);
  const columns = useAppSelector((s) => s.data.columns);
  const today = todayStr();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Open a project to see its board, Gantt, calendar and list.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p, i) => {
          const stats = computeStats(
            tasks.filter((t) => t.projectId === p.id),
            columns,
            today,
          );
          return (
            <li
              key={p.id}
              className="animate-row-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Link
                href={`/projects/${p.id}`}
                className="group relative block overflow-hidden rounded-2xl border bg-card p-5 outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: p.color }}
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2">
                  <h2 className="min-w-0 flex-1 truncate font-semibold">
                    {p.name}
                  </h2>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {p.key}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {stats.total} tasks · {stats.overdue} overdue
                  </span>
                  <span className="tabular-nums font-medium text-foreground">
                    {stats.completionPct}%
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${stats.completionPct}%`,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
                <ArrowRight className="absolute bottom-5 right-5 size-4 translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
