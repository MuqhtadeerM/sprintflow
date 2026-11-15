"use client";

import { useMemo, useState } from "react";
import { Link2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/shared/native-select";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addDependency, removeDependency } from "@/store/slices/data-slice";
import { openTask } from "@/store/slices/ui-slice";
import { wouldCreateCycle } from "@/lib/dependency-utils";
import type { Task } from "@/types";

type Direction = "blockedBy" | "blocks";

export function DependenciesSection({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  const allTasks = useAppSelector((s) => s.data.tasks);
  const columns = useAppSelector((s) => s.data.columns);
  const dependencies = useAppSelector((s) => s.data.dependencies);

  const [direction, setDirection] = useState<Direction>("blockedBy");
  const [otherId, setOtherId] = useState("");

  const taskById = useMemo(
    () => new Map(allTasks.map((t) => [t.id, t] as const)),
    [allTasks],
  );
  const columnById = useMemo(
    () => new Map(columns.map((c) => [c.id, c] as const)),
    [columns],
  );

  const blockedBy = dependencies.filter((d) => d.successorId === task.id);
  const blocks = dependencies.filter((d) => d.predecessorId === task.id);

  const linked = new Set([
    ...(direction === "blockedBy"
      ? blockedBy.map((d) => d.predecessorId)
      : blocks.map((d) => d.successorId)),
  ]);
  const candidates = allTasks.filter(
    (t) =>
      t.projectId === task.projectId && t.id !== task.id && !linked.has(t.id),
  );

  const add = () => {
    if (!otherId) return;
    const predecessorId = direction === "blockedBy" ? otherId : task.id;
    const successorId = direction === "blockedBy" ? task.id : otherId;
    if (wouldCreateCycle(dependencies, predecessorId, successorId)) {
      toast.error("That would create a loop", {
        description:
          "Task A can't wait on B if B (directly or indirectly) waits on A.",
      });
      return;
    }
    dispatch(addDependency(predecessorId, successorId));
    setOtherId("");
  };

  const renderList = (
    title: string,
    items: { id: string; otherTaskId: string }[],
  ) =>
    items.length > 0 && (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <ul className="space-y-1">
          {items.map(({ id, otherTaskId }) => {
            const other = taskById.get(otherTaskId);
            if (!other) return null;
            const column = columnById.get(other.columnId);
            return (
              <li
                key={id}
                className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => dispatch(openTask(other.id))}
                  className="min-w-0 flex-1 truncate text-left text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {other.title}
                </button>
                {column && (
                  <StatusBadge
                    statusKey={column.statusKey}
                    label={column.name}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label={`Remove dependency on ${other.title}`}
                  onClick={() => dispatch(removeDependency(id))}
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    );

  return (
    <div className="space-y-3">
      {renderList(
        "Blocked by (must finish first)",
        blockedBy.map((d) => ({ id: d.id, otherTaskId: d.predecessorId })),
      )}
      {renderList(
        "Blocks (waiting on this task)",
        blocks.map((d) => ({ id: d.id, otherTaskId: d.successorId })),
      )}
      {blockedBy.length === 0 && blocks.length === 0 && (
        <p className="text-sm text-muted-foreground">No dependencies.</p>
      )}

      <div className="grid grid-cols-[auto_1fr_auto] gap-2">
        <NativeSelect
          aria-label="Dependency type"
          value={direction}
          onChange={(e) => {
            setDirection(e.target.value as Direction);
            setOtherId("");
          }}
          className="w-32"
        >
          <option value="blockedBy">Blocked by</option>
          <option value="blocks">Blocks</option>
        </NativeSelect>
        <NativeSelect
          aria-label="Task to link"
          value={otherId}
          onChange={(e) => setOtherId(e.target.value)}
        >
          <option value="">Choose a task…</option>
          {candidates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </NativeSelect>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={add}
          disabled={!otherId}
        >
          <Link2 className="size-4" />
          Link
        </Button>
      </div>
    </div>
  );
}
