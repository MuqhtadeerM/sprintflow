"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Columns3 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { AddColumn } from "./add-column";
import { KanbanColumn } from "./kanban-column";
import { TaskCardBody, type BoardLookups, type CardActions } from "./task-card";
import { useFilters } from "@/hooks/use-filters";
import { useProjectTasks } from "@/hooks/use-project-tasks";
import { useTaskActions } from "@/hooks/use-task-actions";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import { deleteTask } from "@/store/slices/data-slice";
import { openTask } from "@/store/slices/ui-slice";
import { todayStr } from "@/lib/date-utils";
import { hasActiveFilters } from "@/lib/filter-utils";
import {
  buildItems,
  findContainer,
  resolveIndex,
  type Items,
} from "@/lib/kanban-utils";
import type { Column, Task } from "@/types";

export function Board({
  projectId,
  sprintId,
}: {
  projectId: string;
  sprintId: string | null;
}) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const { moveToColumn, duplicate } = useTaskActions();
  const { filters } = useFilters();

  const visibleTasks = useProjectTasks(projectId, sprintId);
  const allColumns = useAppSelector((s) => s.data.columns);
  const allTasks = useAppSelector((s) => s.data.tasks);
  const users = useAppSelector((s) => s.data.users);
  const labels = useAppSelector((s) => s.data.labels);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragItems, setDragItems] = useState<Items | null>(null);
  const [blockedId, setBlockedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const originRef = useRef<string | null>(null);

  const columns = useMemo(
    () =>
      allColumns
        .filter((c) => c.projectId === projectId)
        .sort((a, b) => a.order - b.order),
    [allColumns, projectId],
  );

  // Real counts (all sprints, no filters): this is what WIP limits are measured against.
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTasks)
      map.set(t.columnId, (map.get(t.columnId) ?? 0) + 1);
    return map;
  }, [allTasks]);

  const fullColumnIds = useMemo(
    () =>
      new Set(
        columns
          .filter(
            (c) => c.wipLimit !== null && (counts.get(c.id) ?? 0) >= c.wipLimit,
          )
          .map((c) => c.id),
      ),
    [columns, counts],
  );

  const lookups: BoardLookups = useMemo(
    () => ({
      labelById: new Map(labels.map((l) => [l.id, l] as const)),
      userById: new Map(users.map((u) => [u.id, u] as const)),
      columns,
      fullColumnIds,
      today: todayStr(),
    }),
    [labels, users, columns, fullColumnIds],
  );

  const taskById = useMemo(
    () => new Map(visibleTasks.map((t) => [t.id, t] as const)),
    [visibleTasks],
  );
  const baseItems = useMemo(
    () => buildItems(columns, visibleTasks),
    [columns, visibleTasks],
  );
  const items = dragItems ?? baseItems;
  const activeTask = activeId ? taskById.get(activeId) : undefined;

  const sensors = useSensors(
    // Moving 6px before a drag starts keeps clicks from becoming drags.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const actions: CardActions = useMemo(
    () => ({
      open: (id) => dispatch(openTask(id)),
      duplicate: (id) => {
        const newId = duplicate(id);
        if (newId) {
          toast.success("Task duplicated", {
            action: {
              label: "Open copy",
              onClick: () => dispatch(openTask(newId)),
            },
          });
        }
      },
      moveTo: (id, column) => {
        if (moveToColumn(id, column)) toast.success(`Moved to ${column.name}`);
      },
      requestDelete: (task) => setPendingDelete(task),
    }),
    [dispatch, duplicate, moveToColumn],
  );

  const isFull = (columnId: string) => fullColumnIds.has(columnId);
  const reset = () => {
    setActiveId(null);
    setDragItems(null);
    setBlockedId(null);
    originRef.current = null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
    setDragItems(baseItems);
    originRef.current = findContainer(baseItems, id) ?? null;
  };

  // While hovering over ANOTHER column we move the card locally so the layout
  // shows where it would land. Reordering inside one column is handled by dnd-kit
  // itself and committed on drop.
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !dragItems) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);

    const overContainer = findContainer(dragItems, overKey);
    const blocked =
      overContainer !== undefined &&
      overContainer !== originRef.current &&
      isFull(overContainer);
    setBlockedId(blocked ? (overContainer as string) : null);

    setDragItems((prev) => {
      if (!prev) return prev;
      const from = findContainer(prev, activeKey);
      const to = findContainer(prev, overKey);
      if (!from || !to || from === to) return prev;
      if (to !== originRef.current && isFull(to)) return prev; // refuse a full column

      const toList = prev[to] ?? [];
      let index: number;
      if (overKey in prev) {
        index = toList.length; // hovering the column itself: go to the end
      } else {
        const rect = active.rect.current.translated;
        const below =
          rect !== null && rect.top > over.rect.top + over.rect.height;
        index = toList.indexOf(overKey) + (below ? 1 : 0);
      }
      return {
        ...prev,
        [from]: (prev[from] ?? []).filter((id) => id !== activeKey),
        [to]: [...toList.slice(0, index), activeKey, ...toList.slice(index)],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const id = String(active.id);
    const final = dragItems;
    const origin = originRef.current;
    const wasBlocked = blockedId;
    reset();

    if (wasBlocked) {
      const column = columns.find((c) => c.id === wasBlocked);
      if (column) {
        toast.error(`“${column.name}” is full`, {
          description: `WIP limit is ${column.wipLimit}. Finish or move a task out first.`,
        });
      }
      return;
    }
    if (!over || !final || !origin) return;

    const container = findContainer(final, id);
    const overContainer = findContainer(final, String(over.id));
    if (!container || !overContainer) return;

    let list = final[container] ?? [];
    if (container === overContainer && String(over.id) !== container) {
      const from = list.indexOf(id);
      const to = list.indexOf(String(over.id));
      if (from >= 0 && to >= 0 && from !== to) list = arrayMove(list, from, to);
    }

    if (container === origin) {
      const before = baseItems[origin] ?? [];
      if (
        before.length === list.length &&
        before.every((v, i) => v === list[i])
      )
        return; // nothing changed
    }

    const column = columns.find((c) => c.id === container);
    if (!column) return;

    // Position among ALL cards in that column, not just the visible ones.
    const fullIds = store
      .getState()
      .data.tasks.filter((t) => t.columnId === container)
      .sort((a, b) => a.order - b.order)
      .map((t) => t.id);
    moveToColumn(id, column, resolveIndex(fullIds, list, id));
  };

  if (columns.length === 0) {
    return (
      <EmptyState
        icon={Columns3}
        title="This board has no columns"
        description="Add your first column to start organising tasks."
        action={<AddColumn projectId={projectId} columns={columns} />}
      />
    );
  }

  return (
    <div className="space-y-3">
      {hasActiveFilters(filters) && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {visibleTasks.length} task
          {visibleTasks.length === 1 ? "" : "s"} that match your filters.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={reset}
      >
        <div className="flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-6 sm:snap-none">
          {columns.map((column: Column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={(items[column.id] ?? [])
                .map((id) => taskById.get(id))
                .filter((t): t is Task => t !== undefined)}
              counts={counts}
              projectColumns={columns}
              lookups={lookups}
              actions={actions}
              blocked={blockedId === column.id}
            />
          ))}
          <AddColumn projectId={projectId} columns={columns} />
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCardBody task={activeTask} lookups={lookups} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this task?"
        description={`“${pendingDelete?.title ?? ""}” and its dependencies will be removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDelete) {
            dispatch(deleteTask(pendingDelete.id));
            toast.success("Task deleted");
          }
        }}
      />
    </div>
  );
}
