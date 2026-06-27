"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ProgressDataPoint {
  date: string;
  peso?: number | null;
  grasso?: number | null;
}

export function ProgressChart({ data }: { data: ProgressDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="peso"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Peso (kg)"
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="grasso"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="% Grasso"
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
