"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  Copy,
  ExternalLink,
  ListChecks,
  MoreHorizontal,
  MoveRight,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LabelChip } from "@/components/shared/label-chip";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { describeDue } from "@/lib/date-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import { isOverdue } from "@/lib/task-utils";
import { cn } from "@/lib/utils";
import type { Column, Label, Task, User } from "@/types";

export interface BoardLookups {
  labelById: Map<string, Label>;
  userById: Map<string, User>;
  columns: Column[];
  fullColumnIds: Set<string>;
  today: string;
}

export interface CardActions {
  open: (taskId: string) => void;
  duplicate: (taskId: string) => void;
  moveTo: (taskId: string, column: Column) => void;
  requestDelete: (task: Task) => void;
}

interface MenuAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  hint?: string;
  separatorBefore?: boolean;
}

function buildActions(
  task: Task,
  lookups: BoardLookups,
  actions: CardActions,
): MenuAction[] {
  const list: MenuAction[] = [
    {
      id: "open",
      label: "Open details",
      icon: ExternalLink,
      onSelect: () => actions.open(task.id),
    },
    {
      id: "dup",
      label: "Duplicate",
      icon: Copy,
      onSelect: () => actions.duplicate(task.id),
    },
  ];
  lookups.columns
    .filter((c) => c.id !== task.columnId)
    .forEach((c, i) =>
      list.push({
        id: `move-${c.id}`,
        label: `Move to ${c.name}`,
        icon: MoveRight,
        onSelect: () => actions.moveTo(task.id, c),
        disabled: lookups.fullColumnIds.has(c.id),
        hint: lookups.fullColumnIds.has(c.id) ? "full" : undefined,
        separatorBefore: i === 0,
      }),
    );
  list.push({
    id: "delete",
    label: "Delete",
    icon: Trash2,
    onSelect: () => actions.requestDelete(task),
    destructive: true,
    separatorBefore: true,
  });
  return list;
}

const itemClass = (a: MenuAction) =>
  a.destructive ? "text-red-600 dark:text-red-400" : undefined;

interface TaskCardBodyProps {
  task: Task;
  lookups: BoardLookups;
  handle?: React.ReactNode;
  menu?: React.ReactNode;
  overlay?: boolean;
}

/** The visual card. Used in the column and, tilted, in the drag overlay. */
export function TaskCardBody({
  task,
  lookups,
  handle,
  menu,
  overlay,
}: TaskCardBodyProps) {
  const column = lookups.columns.find((c) => c.id === task.columnId);
  const done = column?.statusKey === "done";
  const overdue = isOverdue(task, lookups.columns, lookups.today);
  const assignee = task.assigneeId
    ? lookups.userById.get(task.assigneeId)
    : undefined;
  const taskLabels = task.labelIds
    .map((id) => lookups.labelById.get(id))
    .filter((l): l is Label => l !== undefined);
  const due = task.dueDate ? describeDue(task.dueDate, done) : null;
  const checkDone = task.checklist.filter((i) => i.done).length;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-3 pl-4 shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        overdue && "border-red-500/40",
        overlay &&
          "rotate-2 scale-[1.03] cursor-grabbing shadow-xl ring-2 ring-primary/40",
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: PRIORITY_META[task.priority].color }}
        aria-hidden="true"
      />

      <div className="absolute right-1.5 top-1.5 flex items-center opacity-100 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
        {menu}
        {handle}
      </div>

      {taskLabels.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1 pr-14">
          {taskLabels.map((l) => (
            <LabelChip key={l.id} label={l} />
          ))}
        </div>
      )}

      {/* A real button so keyboard users can focus and press Enter. Its click
          bubbles up to the card's onClick, which opens the drawer. */}
      <button
        type="button"
        className={cn(
          "block w-full rounded text-left text-sm font-medium leading-snug outline-none focus-visible:ring-2 focus-visible:ring-ring",
          taskLabels.length === 0 && "pr-14",
          done && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </button>

      <div className="mt-2.5 flex items-center gap-2.5">
        <PriorityIndicator priority={task.priority} showLabel={false} />
        {due && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground",
              due.tone === "overdue" &&
                "font-medium text-red-600 dark:text-red-400",
              due.tone === "soon" &&
                "font-medium text-amber-600 dark:text-amber-400",
            )}
          >
            {due.tone === "overdue" ? (
              <span
                className="animate-pulse-ring size-2 rounded-full bg-red-500"
                aria-hidden="true"
              />
            ) : (
              <CalendarDays className="size-3" aria-hidden="true" />
            )}
            {due.text}
          </span>
        )}
        {task.checklist.length > 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground",
              checkDone === task.checklist.length &&
                "text-emerald-600 dark:text-emerald-400",
            )}
            title="Checklist progress"
          >
            <ListChecks className="size-3" aria-hidden="true" />
            {checkDone}/{task.checklist.length}
          </span>
        )}
        {assignee && (
          <span className="ml-auto" title={assignee.name}>
            <UserAvatar user={assignee} size={22} />
          </span>
        )}
      </div>

      {task.progress > 0 && !done && (
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 bg-muted"
          aria-hidden="true"
        >
          <div
            className="h-full bg-primary/70 transition-[width] duration-500"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}
    </article>
  );
}

interface SortableTaskCardProps {
  task: Task;
  lookups: BoardLookups;
  actions: CardActions;
}

export function SortableTaskCard({
  task,
  lookups,
  actions,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const menuActions = buildActions(task, lookups, actions);

  // The wrapper span stops clicks from React-bubbling (even from the portaled
  // menu) up to the card's onClick, which would also open the drawer.
  const kebab = (
    <span onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={`Actions for ${task.title}`}
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {menuActions.map((a) => (
            <div key={a.id}>
              {a.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={a.onSelect}
                disabled={a.disabled}
                className={itemClass(a)}
              >
                <a.icon className="size-4" />
                {a.label}
                {a.hint && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {a.hint}
                  </span>
                )}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );

  return (
    // The whole card is the drag target: attributes + listeners live on the wrapper.
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${task.title}. Press space to pick up, arrow keys to move, space to drop.`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "cursor-grab rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      <ContextMenu>
        <ContextMenuTrigger
          className="block"
          onClick={() => actions.open(task.id)}
        >
          <TaskCardBody task={task} lookups={lookups} menu={kebab} />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          {menuActions.map((a) => (
            <div key={a.id}>
              {a.separatorBefore && <ContextMenuSeparator />}
              <ContextMenuItem
                onClick={a.onSelect}
                disabled={a.disabled}
                className={itemClass(a)}
              >
                <a.icon className="size-4" />
                {a.label}
                {a.hint && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {a.hint}
                  </span>
                )}
              </ContextMenuItem>
            </div>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
