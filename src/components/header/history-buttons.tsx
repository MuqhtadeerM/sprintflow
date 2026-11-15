"use client";

import { Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHistoryActions } from "@/hooks/use-history-actions";
import { modKey } from "@/lib/platform";
import { useAppSelector } from "@/store/hooks";

export function HistoryButtons() {
  const { undo, redo } = useHistoryActions();
  const labels = useAppSelector((s) => s.ui.historyLabels);
  const mod = modKey();

  const buttons = [
    {
      name: "Undo",
      icon: Undo2,
      label: labels.undo,
      run: undo,
      hint: `${mod}+Z`,
    },
    {
      name: "Redo",
      icon: Redo2,
      label: labels.redo,
      run: redo,
      hint: `${mod}+Shift+Z`,
    },
  ];

  return (
    <div className="flex items-center" role="group" aria-label="History">
      {buttons.map(({ name, icon: Icon, label, run, hint }) => (
        <Tooltip key={name}>
          {/* A span trigger, because disabled buttons don't receive hover events */}
          <TooltipTrigger render={<span />}>
            <Button
              variant="ghost"
              size="icon"
              disabled={!label}
              onClick={run}
              aria-label={
                label ? `${name}: ${label}` : `Nothing to ${name.toLowerCase()}`
              }
            >
              <Icon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {label ? `${name}: ${label}` : `Nothing to ${name.toLowerCase()}`} (
            {hint})
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
