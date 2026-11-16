"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { History } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Activity, User } from "@/types";

interface ActivityFeedProps {
  items: Activity[];
  userById: Map<string, User>;
  existingTaskIds: Set<string>;
  onOpen: (taskId: string) => void;
}

export function ActivityFeed({
  items,
  userById,
  existingTaskIds,
  onOpen,
}: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <History className="size-6" aria-hidden="true" />
        No activity yet. Move, edit or create a task and it shows up here.
      </div>
    );
  }
  return (
    <ul className="-mx-2 space-y-0.5">
      {items.map((a) => {
        const actor = userById.get(a.actorId);
        const canOpen = existingTaskIds.has(a.taskId);
        const content = (
          <>
            {actor ? (
              <UserAvatar user={actor} size={24} />
            ) : (
              <span
                className="size-6 shrink-0 rounded-full bg-muted"
                aria-hidden="true"
              />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{a.message}</span>
              <span className="block text-xs text-muted-foreground">
                {actor?.name ?? "Someone"} ·{" "}
                {formatDistanceToNow(parseISO(a.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </span>
          </>
        );
        return (
          <li key={a.id}>
            {canOpen ? (
              <button
                type="button"
                onClick={() => onOpen(a.taskId)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-2 py-2">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

