import { wipState } from "@/lib/kanban-utils";
import { cn } from "@/lib/utils";

const TONE = {
  none: "",
  ok: "bg-emerald-500",
  near: "bg-amber-500",
  full: "bg-amber-500",
  over: "bg-red-500",
} as const;

export function WipGauge({
  count,
  limit,
}: {
  count: number;
  limit: number | null;
}) {
  const state = wipState(count, limit);

  if (limit === null) {
    return (
      <span className="text-xs tabular-nums text-muted-foreground">
        {count}
      </span>
    );
  }

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={`${count} of ${limit} work-in-progress slots used${
        state === "over" ? ", over the limit" : state === "full" ? ", full" : ""
      }`}
    >
      {limit <= 8 ? (
        <span className="flex gap-0.5" aria-hidden="true">
          {Array.from({ length: Math.max(limit, count) }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-3 w-1.5 rounded-sm transition-colors duration-300",
                i < count ? TONE[state] : "bg-muted-foreground/20",
              )}
            />
          ))}
        </span>
      ) : (
        <span
          className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
          aria-hidden="true"
        >
          <span
            className={cn(
              "block h-full rounded-full transition-[width] duration-300",
              TONE[state],
            )}
            style={{ width: `${Math.min(100, (count / limit) * 100)}%` }}
          />
        </span>
      )}
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          state === "over" && "text-red-600 dark:text-red-400",
          (state === "full" || state === "near") &&
            "text-amber-600 dark:text-amber-400",
          state === "ok" && "text-muted-foreground",
        )}
      >
        {count}/{limit}
        {state === "full" && " · Full"}
        {state === "over" && " · Over limit"}
      </span>
    </div>
  );
}
