"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { ALL_SPRINTS } from "@/hooks/use-project-context";
import type { Task } from "@/types";

/** Tasks for one project, narrowed to a sprint unless sprintId is "all". */
export function useProjectTasks(
  projectId: string | null,
  sprintId: string | null,
): Task[] {
  const allTasks = useAppSelector((s) => s.data.tasks);

  return useMemo(
    () =>
      allTasks.filter(
        (t) =>
          t.projectId === projectId &&
          (sprintId === null ||
            sprintId === ALL_SPRINTS ||
            t.sprintId === sprintId),
      ),
    [allTasks, projectId, sprintId],
  );
}
