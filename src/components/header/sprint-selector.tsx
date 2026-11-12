"use client";

import { Check, ChevronDown, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ALL_SPRINTS, useProjectContext } from "@/hooks/use-project-context";
import { useAppSelector } from "@/store/hooks";
import { formatShort } from "@/lib/date-utils";

export function SprintSelector() {
  const hydrated = useAppSelector((s) => s.ui.hydrated);
  const { sprints, sprintId, sprint, setParam } = useProjectContext();

  // The default sprint depends on today's date, which differs between server
  // and browser timezones. Wait for the client to avoid a hydration mismatch.
  if (!hydrated || sprints.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-8 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Select sprint"
      >
        <Flag className="size-3.5 text-muted-foreground" />
        {sprint ? sprint.name : "All sprints"}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sprints</DropdownMenuLabel>
          {sprints.map((s) => (
            <DropdownMenuItem
              key={s.id}
              className="justify-between"
              onClick={() => setParam("sprint", s.id)}
            >
              <span className="min-w-0">
                <span className="block truncate">{s.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatShort(s.startDate)} – {formatShort(s.endDate)}
                </span>
              </span>
              {s.id === sprintId && <Check className="size-4 shrink-0" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            className="justify-between"
            onClick={() => setParam("sprint", ALL_SPRINTS)}
          >
            All sprints
            {sprintId === ALL_SPRINTS && <Check className="size-4" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
