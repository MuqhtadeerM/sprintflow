import type { Label } from "@/types";

export function LabelChip({ label }: { label: Label }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium"
      style={{ color: label.color, backgroundColor: `${label.color}1f` }}
    >
      {label.name}
    </span>
  );
}
