"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BarDatum = { label: string } & Record<string, string | number>;

export function Bars({
  data,
  series,
  height = 220,
  stacked = false,
}: {
  data: BarDatum[];
  series: { key: string; label: string; color: string }[];
  height?: number;
  stacked?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "#eef2ff", opacity: 0.5 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
          }}
        />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color}
            stackId={stacked ? "stack" : undefined}
            radius={
              !stacked || i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
            }
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
