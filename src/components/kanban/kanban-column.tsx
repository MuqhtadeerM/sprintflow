"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Inbox, MoreHorizontal, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommitInput } from "@/components/shared/commit-input";
import { ColumnSettingsDialog, DeleteColumnDialog } from "./column-dialogs";
import {
  SortableTaskCard,
  type BoardLookups,
  type CardActions,
} from "./task-card";
import { WipGauge } from "./wip-gauge";
import { useAppDispatch } from "@/store/hooks";
import { renameColumn } from "@/store/slices/data-slice";
import { openCreateTask } from "@/store/slices/ui-slice";
import { wipState } from "@/lib/kanban-utils";
import { STATUS_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import type { Column, Task } from "@/types";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[]; // visible cards, in order
  counts: Map<string, number>; // real task count per column (all sprints)
  projectColumns: Column[];
  lookups: BoardLookups;
  actions: CardActions;
  blocked: boolean;
}

export function KanbanColumn({
  column,
  tasks,
  counts,
  projectColumns,
  lookups,
  actions,
  blocked,
}: KanbanColumnProps) {
  const dispatch = useAppDispatch();
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const total = counts.get(column.id) ?? 0;
  const state = wipState(total, column.wipLimit);
  const color = STATUS_META[column.statusKey].color;
  const hidden = total - tasks.length; // tasks hidden by sprint or filters

  return (
    <section
      aria-label={`${column.name} column`}
      className={cn(
        "flex w-[82vw] max-w-80 shrink-0 snap-center flex-col rounded-2xl border bg-muted/30 transition-colors duration-200 sm:w-72",
        isOver && !blocked && "border-primary/50 bg-primary/5",
        blocked && "animate-shake border-red-500/70 bg-red-500/5",
      )}
    >
      <div
        className="h-1 rounded-t-2xl"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <header className="space-y-2 p-3 pb-2">
        <div className="flex items-center gap-1">
          <CommitInput
            value={column.name}
            aria-label={`Rename column ${column.name}`}
            maxLength={24}
            className="h-7 border-transparent bg-transparent px-1.5 text-sm font-semibold shadow-none hover:border-input focus-visible:border-input"
            onCommit={(next) => {
              const name = next.trim();
              if (!name) return toast.error("A column needs a name");
              if (
                projectColumns.some(
                  (c) =>
                    c.id !== column.id &&
                    c.name.toLowerCase() === name.toLowerCase(),
                )
              ) {
                return toast.error("Another column already has that name");
              }
              dispatch(renameColumn({ id: column.id, name }));
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label={`Add task to ${column.name}`}
            onClick={() => dispatch(openCreateTask({ columnId: column.id }))}
          >
            <Plus className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  aria-label={`${column.name} column menu`}
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings2 className="size-4" />
                Limit &amp; status…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={projectColumns.length <= 1}
                className="text-red-600 dark:text-red-400"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete column…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between gap-2 px-1.5">
          <WipGauge count={total} limit={column.wipLimit} />
          {hidden > 0 && (
            <span
              className="text-[11px] text-muted-foreground"
              title="Tasks in this column that are in another sprint or hidden by filters"
            >
              +{hidden} hidden
            </span>
          )}
        </div>
        {blocked && (
          <p
            role="alert"
            className="px-1.5 text-xs font-medium text-red-600 dark:text-red-400"
          >
            WIP limit reached. Drop it somewhere else.
          </p>
        )}
        {!blocked && state === "over" && (
          <p className="px-1.5 text-xs text-red-600 dark:text-red-400">
            Over its limit. Move something out.
          </p>
        )}
      </header>

      <div ref={setNodeRef} className="min-h-24 flex-1 space-y-2 p-3 pt-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              lookups={lookups}
              actions={actions}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed py-8 text-center text-xs text-muted-foreground">
            <Inbox className="size-5" aria-hidden="true" />
            Drop tasks here
          </div>
        )}
      </div>

      <ColumnSettingsDialog
        column={column}
        count={total}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <DeleteColumnDialog
        column={column}
        others={projectColumns.filter((c) => c.id !== column.id)}
        counts={counts}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </section>
  );
}

