"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { ALL_SPRINTS } from "@/hooks/use-project-context";
import { useFilters } from "@/hooks/use-filters";
import { applyFilters } from "@/lib/filter-utils";
import { todayStr } from "@/lib/date-utils";
import type { Task } from "@/types";

/** Tasks for one project and sprint, narrowed by the shared URL filters. */
export function useProjectTasks(
  projectId: string | null,
  sprintId: string | null,
): Task[] {
  const allTasks = useAppSelector((s) => s.data.tasks);
  const columns = useAppSelector((s) => s.data.columns);
  const { filters } = useFilters();

  return useMemo(() => {
    const scoped = allTasks.filter(
      (t) =>
        t.projectId === projectId &&
        (sprintId === null ||
          sprintId === ALL_SPRINTS ||
          t.sprintId === sprintId),
    );
    return applyFilters(scoped, filters, columns, todayStr());
  }, [allTasks, columns, filters, projectId, sprintId]);
}
