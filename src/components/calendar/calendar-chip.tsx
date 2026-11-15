"use client";

import { useDraggable } from "@dnd-kit/core";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import type { Task, User } from "@/types";

export interface ChipInfo {
  color: string;
  overdue: boolean;
  done: boolean;
  assignee?: User;
}

export type ChipSize = "sm" | "md";

interface ChipBodyProps {
  task: Task;
  info: ChipInfo;
  size: ChipSize;
  overlay?: boolean;
}

export function ChipBody({ task, info, size, overlay }: ChipBodyProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border bg-card text-left shadow-xs transition-shadow hover:shadow-sm",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2.5 py-2 text-sm",
        info.overdue && "border-red-500/50 bg-red-500/5",
        overlay && "w-56 rotate-2 shadow-lg ring-2 ring-primary/40",
      )}
      style={{ borderLeftColor: info.color, borderLeftWidth: 3 }}
    >
      {info.overdue && (
        <span
          className="animate-pulse-ring size-1.5 shrink-0 rounded-full bg-red-500"
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-medium",
          info.done && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </span>
      {size === "md" && (
        <PriorityIndicator priority={task.priority} showLabel={false} />
      )}
      {size === "md" && info.assignee && (
        <UserAvatar user={info.assignee} size={20} />
      )}
      {info.overdue && <span className="sr-only">Overdue</span>}
    </div>
  );
}

interface DraggableChipProps extends ChipBodyProps {
  onOpen: (taskId: string) => void;
}

export function DraggableChip({
  task,
  info,
  size,
  onOpen,
}: DraggableChipProps) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      {/* A real button, so Tab + Enter opens the drawer. dnd-kit cancels the
          click that would follow a drag. */}
      <button
        type="button"
        title={task.title}
        onClick={() => onOpen(task.id)}
        className="block w-full rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChipBody task={task} info={info} size={size} />
      </button>
    </div>
  );
}
