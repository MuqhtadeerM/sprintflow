"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  "my-tasks": "My Tasks",
  projects: "Projects",
  calendar: "Calendar",
  timeline: "Timeline",
  reports: "Reports",
  settings: "Settings",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const workspace = useAppSelector((s) => s.data.workspaces[0]);
  const projects = useAppSelector((s) => s.data.projects);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, i) => {
    const href = `/${segments.slice(0, i + 1).join("/")}`;
    const isProjectId = segments[0] === "projects" && i === 1;
    const label = isProjectId
      ? (projects.find((p) => p.id === segment)?.name ?? "Unknown project")
      : (TITLES[segment] ?? segment);
    return { href, label };
  });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        <li className="hidden text-muted-foreground sm:block">
          {workspace?.name}
        </li>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight
                className={`size-3.5 text-muted-foreground ${i === 0 ? "hidden sm:block" : ""}`}
              />
              {last ? (
                <span aria-current="page" className="truncate font-medium">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate text-muted-foreground hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
