import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TagChartDatum } from "../lib/aggregate";
import { formatDuration } from "../lib/format";

export default function TimeByTagChart({ data }: { data: TagChartDatum[] }) {
  if (data.length === 0) return <p className="text-sm text-accent">No time tracked in this range.</p>;
  const hours = data.map((d) => ({ ...d, hours: d.seconds / 3600 }));
  return (
    <div role="img" aria-label="Time by tag" style={{ height: 40 * hours.length + 40 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={hours} layout="vertical" margin={{ left: 8, right: 72 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            formatter={(_v, _n, item) => formatDuration((item.payload as TagChartDatum).seconds)}
          />
          <Bar dataKey="hours" radius={[0, 8, 8, 0]} isAnimationActive={false}
            label={{ position: "right", fontSize: 12, formatter: (v: unknown) => formatDuration(Number(v) * 3600) }}>
            {hours.map((d) => <Cell key={d.key} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
