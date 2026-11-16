"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, TOOLTIP_PROPS } from "./chart-card";
import type { WorkloadRow } from "@/lib/dashboard-utils";

const OPEN = "#6366f1";
const DONE = "#10b981";

export function WorkloadChart({ rows }: { rows: WorkloadRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No assigned work in this scope.
      </p>
    );
  }
  const summary = rows
    .map((r) => `${r.name} ${r.open} open, ${r.done} done`)
    .join("; ");

  return (
    <div className="space-y-3">
      <div
        style={{ height: Math.max(160, rows.length * 40 + 24) }}
        role="img"
        aria-label={`Team workload: ${summary}`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={78}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              {...TOOLTIP_PROPS}
            />
            <Bar
              dataKey="open"
              name="Open"
              stackId="work"
              fill={OPEN}
              barSize={16}
            />
            <Bar
              dataKey="done"
              name="Done"
              stackId="work"
              fill={DONE}
              barSize={16}
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: OPEN }}
            aria-hidden="true"
          />
          Open
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: DONE }}
            aria-hidden="true"
          />
          Done
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-3 text-xs">
        {rows.map((r) => (
          <li key={r.id} className="flex justify-between gap-2">
            <span className="truncate">{r.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {r.hours}h open
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
