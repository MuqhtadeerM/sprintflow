"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addComment } from "@/store/slices/data-slice";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

type Tab = "comments" | "activity";

const ago = (iso: string) =>
  formatDistanceToNow(parseISO(iso), { addSuffix: true });

export function ActivitySection({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.data.users);
  const activities = useAppSelector((s) => s.data.activities);
  const currentUserId = useAppSelector((s) => s.data.currentUserId);

  const [tab, setTab] = useState<Tab>("comments");
  const [body, setBody] = useState("");

  const userById = useMemo(
    () => new Map(users.map((u) => [u.id, u] as const)),
    [users],
  );
  const feed = useMemo(
    () => activities.filter((a) => a.taskId === task.id),
    [activities, task.id],
  );

  const post = () => {
    const text = body.trim();
    if (!text) return;
    dispatch(addComment(task.id, currentUserId, text));
    setBody("");
  };

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Comments or activity"
        className="inline-flex rounded-lg border bg-muted/50 p-0.5"
      >
        {(["comments", "activity"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {t}
            {t === "comments" &&
              task.comments.length > 0 &&
              ` (${task.comments.length})`}
          </button>
        ))}
      </div>

      {tab === "comments" ? (
        <>
          <ul className="space-y-3">
            {task.comments.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No comments yet. Start the conversation.
              </li>
            )}
            {task.comments.map((c) => {
              const author = userById.get(c.authorId);
              return (
                <li key={c.id} className="flex gap-2.5">
                  {author && <UserAvatar user={author} size={26} />}
                  <div className="min-w-0 flex-1 rounded-xl bg-muted/50 px-3 py-2">
                    <p className="text-xs">
                      <span className="font-medium">
                        {author?.name ?? "Unknown"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {ago(c.createdAt)}
                      </span>
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">
                      {c.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="space-y-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  post();
                }
              }}
              rows={3}
              placeholder="Write a comment…  (Ctrl/Cmd + Enter to send)"
              aria-label="New comment"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={post} disabled={!body.trim()}>
                <Send className="size-4" />
                Comment
              </Button>
            </div>
          </div>
        </>
      ) : (
        <ol className="relative space-y-3 border-l pl-4">
          {feed.length === 0 && (
            <li className="text-sm text-muted-foreground">No activity yet.</li>
          )}
          {feed.map((a) => (
            <li key={a.id} className="relative text-sm">
              <span
                className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary"
                aria-hidden="true"
              />
              <p>{a.message}</p>
              <p className="text-xs text-muted-foreground">
                {userById.get(a.actorId)?.name ?? "Someone"} ·{" "}
                {ago(a.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
