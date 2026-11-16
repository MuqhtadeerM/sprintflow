import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ChartCard({
  title,
  description,
  children,
  className,
  delay = 0,
}: ChartCardProps) {
  return (
    <section
      className={cn("animate-row-in rounded-2xl border bg-card p-4", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Makes Recharts tooltips follow the light/dark theme. */
export const TOOLTIP_PROPS = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--popover-foreground)",
  },
  itemStyle: { color: "var(--popover-foreground)" },
  labelStyle: { color: "var(--popover-foreground)" },
} as const;

export const AXIS_TICK = {
  fill: "var(--muted-foreground)",
  fontSize: 12,
} as const;
