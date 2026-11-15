"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppStore } from "@/store/hooks";
import { moveTask } from "@/store/slices/data-slice";
import type { Column } from "@/types";

export function useTaskActions() {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  /** Moves a task to a column. Returns false (with a toast) if a WIP limit blocks it. */
  const moveToColumn = useCallback(
    (
      taskId: string,
      column: Column,
      toIndex: number = Number.MAX_SAFE_INTEGER,
    ): boolean => {
      const { tasks } = store.getState().data;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return false;

      if (task.columnId !== column.id && column.wipLimit !== null) {
        const inColumn = tasks.filter((t) => t.columnId === column.id).length;
        if (inColumn >= column.wipLimit) {
          toast.error(`“${column.name}” is full`, {
            description: `WIP limit is ${column.wipLimit}. Finish or move a task out first.`,
          });
          return false;
        }
      }
      dispatch(moveTask({ taskId, toColumnId: column.id, toIndex }));
      return true;
    },
    [dispatch, store],
  );

  return { moveToColumn };
}
