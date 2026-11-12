import { STATUS_META } from "@/lib/task-meta";
import type { StatusKey } from "@/types";

interface StatusBadgeProps {
  statusKey: StatusKey;
  /** Custom column name, e.g. "Ready for QA". Falls back to the default label. */
  label?: string;
}

export function StatusBadge({ statusKey, label }: StatusBadgeProps) {
  const meta = STATUS_META[statusKey];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{
        color: meta.color,
        borderColor: `${meta.color}40`,
        backgroundColor: `${meta.color}14`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
        aria-hidden="true"
      />
      {label ?? meta.label}
    </span>
  );
}
