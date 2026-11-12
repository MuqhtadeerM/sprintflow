"use client";

import Link from "next/link";
import {
  CalendarDays,
  Columns3,
  GanttChart,
  List,
  type LucideIcon,
} from "lucide-react";
import {
  useProjectContext,
  type ProjectView,
} from "@/hooks/use-project-context";
import { cn } from "@/lib/utils";

const VIEWS: { id: ProjectView; label: string; icon: LucideIcon }[] = [
  { id: "board", label: "Board", icon: Columns3 },
  { id: "gantt", label: "Gantt", icon: GanttChart },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "list", label: "List", icon: List },
];

export function ViewSwitcher({ className }: { className?: string }) {
  const { view, hrefWith } = useProjectContext();

  return (
    <nav
      aria-label="Project views"
      className={cn(
        "inline-flex rounded-lg border bg-muted/50 p-0.5",
        className,
      )}
    >
      {VIEWS.map(({ id, label, icon: Icon }) => {
        const active = view === id;
        return (
          <Link
            key={id}
            href={hrefWith("view", id === "board" ? null : id)}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
