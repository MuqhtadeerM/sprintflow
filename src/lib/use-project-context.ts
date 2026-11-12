"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { todayStr } from "@/lib/date-utils";
import type { Project, Sprint } from "@/types";

export const VIEW_TYPES = ["board", "gantt", "calendar", "list"] as const;
export type ProjectView = (typeof VIEW_TYPES)[number];

export const ALL_SPRINTS = "all";

function parseView(value: string | null): ProjectView {
  return (VIEW_TYPES as readonly string[]).includes(value ?? "")
    ? (value as ProjectView)
    : "board";
}

export interface ProjectContext {
  projectId: string | null;
  project: Project | null;
  view: ProjectView;
  sprints: Sprint[]; // this project's sprints, oldest first
  /** A sprint id, or "all". null when there are no sprints. */
  sprintId: string | null;
  sprint: Sprint | null;
  setParam: (key: string, value: string | null) => void;
  /** Builds a link to the current page with one query param changed. */
  hrefWith: (key: string, value: string | null) => string;
}

export function useProjectContext(): ProjectContext {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const allProjects = useAppSelector((s) => s.data.projects);
  const allSprints = useAppSelector((s) => s.data.sprints);

  const segments = pathname.split("/").filter(Boolean);
  const projectId = segments[0] === "projects" ? (segments[1] ?? null) : null;

  const project = useMemo(
    () => allProjects.find((p) => p.id === projectId) ?? null,
    [allProjects, projectId],
  );

  const sprints = useMemo(
    () =>
      allSprints
        .filter((s) => s.projectId === projectId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [allSprints, projectId],
  );

  const view = parseView(searchParams.get("view"));
  const sprintParam = searchParams.get("sprint");

  const sprintId = useMemo(() => {
    if (sprints.length === 0) return null;
    if (sprintParam === ALL_SPRINTS) return ALL_SPRINTS;
    if (sprintParam && sprints.some((s) => s.id === sprintParam))
      return sprintParam;
    // Default: the sprint running today, otherwise the most recent one.
    const today = todayStr();
    const current = sprints.find(
      (s) => s.startDate <= today && today <= s.endDate,
    );
    return (current ?? sprints[sprints.length - 1]).id;
  }, [sprints, sprintParam]);

  const sprint = sprints.find((s) => s.id === sprintId) ?? null;

  const hrefWith = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) params.delete(key);
      else params.set(key, value);
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      router.replace(hrefWith(key, value), { scroll: false });
    },
    [router, hrefWith],
  );

  return {
    projectId,
    project,
    view,
    sprints,
    sprintId,
    sprint,
    setParam,
    hrefWith,
  };
}
