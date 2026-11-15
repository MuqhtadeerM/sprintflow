"use client";

import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatShort } from "@/lib/date-utils";
import { BAR_H, ROW_H, type Span } from "@/lib/gantt-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import type { Task, User } from "@/types";

interface GanttBarProps {
  task: Task;
  span: Span;
  left: number;
  width: number;
  color: string;
  done: boolean;
  overdue: boolean;
  assignee?: User;
  dragging: boolean;
  linkTarget: boolean;
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

export function GanttBar({
  task,
  span,
  left,
  width,
  color,
  done,
  overdue,
  assignee,
  dragging,
  linkTarget,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
}: GanttBarProps) {
  const showTitle = width >= 96;
  const showAvatar = assignee !== undefined && width >= 44;
  const showPriority = width >= 170;
  const range = `${formatShort(span.start)} – ${formatShort(span.end)}`;

  return (
    <div
      role="button"
      tabIndex={0}
      data-task-id={task.id}
      title={`${task.title}\n${range} · ${PRIORITY_META[task.priority].label} priority · ${task.progress}%`}
      aria-label={`${task.title}, ${range}, ${task.progress}% complete. Enter opens it. Arrow keys move it a day. Shift plus arrow keys resize it.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
      className={cn(
        "group/bar absolute z-20 flex cursor-grab touch-none select-none items-center rounded-lg border outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring",
        dragging && "z-30 cursor-grabbing shadow-lg",
        overdue && "ring-1 ring-red-500",
        linkTarget && "ring-2 ring-primary",
        done && "opacity-70",
      )}
      style={{
        left,
        width,
        top: (ROW_H - BAR_H) / 2,
        height: BAR_H,
        borderColor: color,
        backgroundColor: `${color}26`,
      }}
    >
      {/* Progress fill, clipped to the rounded bar */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[7px]"
        aria-hidden="true"
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${task.progress}%`, backgroundColor: `${color}66` }}
        />
      </div>

      <div className="pointer-events-none relative flex min-w-0 flex-1 items-center gap-1.5 px-2">
        {showAvatar && assignee && <UserAvatar user={assignee} size={18} />}
        {showTitle && (
          <span className="min-w-0 flex-1 truncate text-xs font-medium">
            {task.title}
          </span>
        )}
        {showPriority && (
          <PriorityIndicator priority={task.priority} showLabel={false} />
        )}
      </div>

      {!showTitle && (
        <span className="pointer-events-none absolute right-full top-1/2 mr-2 max-w-40 -translate-y-1/2 truncate whitespace-nowrap text-xs text-muted-foreground">
          {task.title}
        </span>
      )}

      {/* Resize handles (a few pixels wider than they look) */}
      <span
        data-handle="start"
        aria-hidden="true"
        className="absolute inset-y-0 -left-1 z-10 w-2.5 cursor-ew-resize"
      />
      <span
        data-handle="end"
        aria-hidden="true"
        className="absolute inset-y-0 -right-1 z-10 w-2.5 cursor-ew-resize"
      />

      {/* Link handle: drag this onto another bar to create a dependency */}
      <span
        data-handle="link"
        aria-hidden="true"
        className="absolute inset-y-0 -right-[26px] z-20 flex w-[22px] cursor-crosshair items-center justify-center opacity-0 transition-opacity group-hover/bar:opacity-100 group-focus-visible/bar:opacity-100 [@media(pointer:coarse)]:opacity-100"
      >
        <span
          className="size-3.5 rounded-full border-2 bg-background"
          style={{ borderColor: color }}
        />
      </span>
    </div>
  );
}
