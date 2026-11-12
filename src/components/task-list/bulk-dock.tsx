"use client";

import { useState } from "react";
import { CircleDot, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  bulkDeleteTasks,
  bulkUpdateTasks,
  moveTask,
} from "@/store/slices/data-slice";
import type { Column, User } from "@/types";

interface BulkDockProps {
  selectedIds: string[];
  projectColumns: Column[];
  users: User[];
  onClear: () => void;
}

export function BulkDock({
  selectedIds,
  projectColumns,
  users,
  onClear,
}: BulkDockProps) {
  const dispatch = useAppDispatch();
  const allTasks = useAppSelector((s) => s.data.tasks);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (selectedIds.length === 0) return null;
  const count = selectedIds.length;

  const moveAll = (column: Column) => {
    const selected = new Set(selectedIds);
    // WIP check up front, so we never move only half of the selection.
    if (column.wipLimit !== null) {
      const staying = allTasks.filter((t) => t.columnId === column.id).length;
      const arriving = allTasks.filter(
        (t) => selected.has(t.id) && t.columnId !== column.id,
      ).length;
      if (staying + arriving > column.wipLimit) {
        toast.error(`"${column.name}" has a WIP limit of ${column.wipLimit}`, {
          description: `Moving ${arriving} task${arriving === 1 ? "" : "s"} would exceed it.`,
        });
        return;
      }
    }
    selectedIds.forEach((taskId) =>
      dispatch(
        moveTask({
          taskId,
          toColumnId: column.id,
          toIndex: Number.MAX_SAFE_INTEGER,
        }),
      ),
    );
    toast.success(
      `Moved ${count} task${count === 1 ? "" : "s"} to ${column.name}`,
    );
  };

  const assignAll = (user: User | null) => {
    dispatch(
      bulkUpdateTasks({
        ids: selectedIds,
        changes: { assigneeId: user?.id ?? null },
      }),
    );
    toast.success(
      user
        ? `Assigned ${count} to ${user.name}`
        : `Unassigned ${count} task${count === 1 ? "" : "s"}`,
    );
  };

  return (
    <>
      <div
        role="toolbar"
        aria-label="Bulk actions"
        className="animate-dock-in fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-1.5rem)] items-center gap-1 rounded-full border bg-card/90 p-1.5 pl-4 shadow-2xl backdrop-blur-md"
      >
        <span className="mr-1 whitespace-nowrap text-sm font-medium tabular-nums">
          {count} selected
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="rounded-full" />
            }
          >
            <CircleDot className="size-4" />
            <span className="hidden sm:inline">Status</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              {projectColumns.map((c) => (
                <DropdownMenuItem key={c.id} onClick={() => moveAll(c)}>
                  {c.name}
                  {c.wipLimit !== null && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      limit {c.wipLimit}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="rounded-full" />
            }
          >
            <UserRound className="size-4" />
            <span className="hidden sm:inline">Assign</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Assign to</DropdownMenuLabel>
              {users.map((u) => (
                <DropdownMenuItem key={u.id} onClick={() => assignAll(u)}>
                  <UserAvatar user={u} size={20} />
                  {u.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => assignAll(null)}>
                Unassign
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-red-600 hover:text-red-600 dark:text-red-400"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-4" />
          <span className="hidden sm:inline">Delete</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onClear}
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${count} task${count === 1 ? "" : "s"}?`}
        description="This also removes their dependencies. You can't undo this yet (undo/redo arrives in Step 11)."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          dispatch(bulkDeleteTasks(selectedIds));
          onClear();
          toast.success(`Deleted ${count} task${count === 1 ? "" : "s"}`);
        }}
      />
    </>
  );
}
