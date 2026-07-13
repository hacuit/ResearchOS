"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type DonutDatum = { name: string; value: number; color: string };

export function Donut({
  data,
  height = 220,
  centerLabel,
  centerValue,
}: {
  data: DonutDatum[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const nonEmpty = data.filter((d) => d.value > 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={nonEmpty}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {nonEmpty.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-slate-900">{centerValue}</p>
          {centerLabel && <p className="text-[11px] text-slate-400">{centerLabel}</p>}
        </div>
      )}
      <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1 text-[11px] text-slate-500">
            <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name} <b className="tabular-nums">{d.value}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
