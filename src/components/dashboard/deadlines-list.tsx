"use client";

import { CalendarCheck } from "lucide-react";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { describeDue } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Task, User } from "@/types";

interface DeadlinesListProps {
  items: Task[];
  total: number;
  userById: Map<string, User>;
  onOpen: (taskId: string) => void;
}

export function DeadlinesList({
  items,
  total,
  userById,
  onOpen,
}: DeadlinesListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <CalendarCheck className="size-6 text-emerald-500" aria-hidden="true" />
        Nothing overdue or due in the next 7 days.
      </div>
    );
  }
  return (
    <>
      <ul className="-mx-2 space-y-0.5">
        {items.map((task) => {
          const due = describeDue(task.dueDate as string, false);
          const assignee = task.assigneeId
            ? userById.get(task.assigneeId)
            : undefined;
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onOpen(task.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PriorityIndicator priority={task.priority} showLabel={false} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {task.title}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs tabular-nums text-muted-foreground",
                    due.tone === "overdue" &&
                      "font-medium text-red-600 dark:text-red-400",
                    due.tone === "soon" &&
                      "font-medium text-amber-600 dark:text-amber-400",
                  )}
                >
                  {due.text}
                </span>
                {assignee && <UserAvatar user={assignee} size={20} />}
              </button>
            </li>
          );
        })}
      </ul>
      {total > items.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          +{total - items.length} more. Use the Overdue filter in a project.
        </p>
      )}
    </>
  );
}
