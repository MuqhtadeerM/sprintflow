"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  buildNotifications,
  type NotificationKind,
} from "@/lib/notification-utils";
import { todayStr } from "@/lib/date-utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openTask } from "@/store/slices/ui-slice";
import { cn } from "@/lib/utils";

const KEY = "sprintflow:read-notifications";

const ICON: Record<NotificationKind, { icon: LucideIcon; tone: string }> = {
  overdue: { icon: AlertTriangle, tone: "text-red-600 dark:text-red-400" },
  wip: { icon: Gauge, tone: "text-amber-600 dark:text-amber-400" },
  due_today: {
    icon: CalendarClock,
    tone: "text-amber-600 dark:text-amber-400",
  },
  due_soon: { icon: CalendarClock, tone: "text-muted-foreground" },
};

function loadRead(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

export function NotificationsBell() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((s) => s.data.tasks);
  const columns = useAppSelector((s) => s.data.columns);
  const projects = useAppSelector((s) => s.data.projects);
  const me = useAppSelector((s) => s.data.currentUserId);

  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(loadRead);

  const items = useMemo(
    () => buildNotifications(tasks, columns, projects, me, todayStr()),
    [tasks, columns, projects, me],
  );
  const unread = items.filter((n) => !read.has(n.id));

  const markRead = (ids: string[]) => {
    const current = new Set(items.map((n) => n.id));
    const next = new Set([...read, ...ids]);
    setRead(next);
    try {
      // Only keep ids that still exist, so the saved list never grows forever.
      window.localStorage.setItem(
        KEY,
        JSON.stringify([...next].filter((id) => current.has(id))),
      );
    } catch {
      /* storage blocked: read state just lasts for this visit */
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              unread.length > 0
                ? `Notifications, ${unread.length} unread`
                : "Notifications"
            }
          />
        }
      >
        <Bell className="size-4" />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={unread.length === 0}
            onClick={() => markRead(items.map((n) => n.id))}
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            You&apos;re all caught up. Overdue and due-soon tasks assigned to
            you show up here.
          </p>
        ) : (
          <ul className="max-h-[60vh] divide-y overflow-y-auto">
            {items.map((n) => {
              const { icon: Icon, tone } = ICON[n.kind];
              const isUnread = !read.has(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead([n.id]);
                      setOpen(false);
                      if (n.taskId) dispatch(openTask(n.taskId));
                      else if (n.projectId)
                        router.push(`/projects/${n.projectId}`);
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted"
                  >
                    <Icon
                      className={cn("mt-0.5 size-4 shrink-0", tone)}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm",
                          isUnread && "font-medium",
                        )}
                      >
                        {n.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {n.detail}
                      </span>
                    </span>
                    {isUnread && (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
