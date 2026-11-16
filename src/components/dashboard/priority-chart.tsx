"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, TOOLTIP_PROPS } from "./chart-card";
import type { Slice } from "@/lib/dashboard-utils";

export function PriorityChart({ data }: { data: Slice[] }) {
  const summary = data.map((d) => `${d.label} ${d.value}`).join(", ");
  return (
    <div
      className="h-56"
      role="img"
      aria-label={`Tasks by priority: ${summary}`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            {...TOOLTIP_PROPS}
          />
          <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
