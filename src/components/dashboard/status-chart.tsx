"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { TOOLTIP_PROPS } from "./chart-card";
import type { Slice } from "@/lib/dashboard-utils";

export function StatusChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const visible = data.filter((d) => d.value > 0);
  const summary = data.map((d) => `${d.label} ${d.value}`).join(", ");

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div
        className="relative h-44 w-44 shrink-0"
        role="img"
        aria-label={`Tasks by status: ${summary}`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={visible}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
            >
              {visible.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP_PROPS} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-xs text-muted-foreground">tasks</span>
        </div>
      </div>

      {/* The legend doubles as the text version of the chart */}
      <ul className="w-full space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {d.value}
              {total > 0 && ` · ${Math.round((d.value / total) * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
