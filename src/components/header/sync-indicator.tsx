"use client";

import { Check, CloudOff, Loader2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const COPY = {
  idle: "Saved",
  saving: "Saving…",
  error: "Not saved",
} as const;

export function SyncIndicator() {
  const status = useAppSelector((s) => s.ui.syncStatus);
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors sm:inline-flex",
        status === "error"
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "text-muted-foreground",
      )}
    >
      {status === "saving" && <Loader2 className="size-3.5 animate-spin" />}
      {status === "idle" && <Check className="size-3.5 text-emerald-500" />}
      {status === "error" && <CloudOff className="size-3.5" />}
      {COPY[status]}
    </span>
  );
}
