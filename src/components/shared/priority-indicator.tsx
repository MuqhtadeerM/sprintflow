import { PRIORITY_META } from "@/lib/task-meta";
import type { Priority } from "@/types";

interface PriorityIndicatorProps {
  priority: Priority;
  showLabel?: boolean;
}

/** Four rising bars, like phone signal. More bars = more urgent. */
export function PriorityIndicator({
  priority,
  showLabel = true,
}: PriorityIndicatorProps) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className="inline-flex items-center gap-2"
      title={`${meta.label} priority`}
    >
      <span className="flex h-4 items-end gap-[2px]" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className="w-[3px] rounded-[1px] transition-colors"
            style={{
              height: `${n * 25}%`,
              backgroundColor: n <= meta.bars ? meta.color : undefined,
              opacity: n <= meta.bars ? 1 : 0.25,
            }}
          />
        ))}
      </span>
      {showLabel ? (
        <span className="text-sm">{meta.label}</span>
      ) : (
        <span className="sr-only">{meta.label} priority</span>
      )}
    </span>
  );
}
