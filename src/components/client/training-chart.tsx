"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export type TrainingDatum = { label: string; min: number; kcal: number };

// Grafico a barre stile Apple Fitness: minuti di allenamento al giorno (14 giorni)
export function TrainingChart({ data }: { data: TrainingDatum[] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, left: -22, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(0,0,0,.05)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#8E8E93" }}
            interval={1}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#8E8E93" }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,59,48,.06)" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,.06)",
              boxShadow: "0 8px 24px rgba(0,0,0,.08)",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) =>
              name === "min" ? [`${value} min`, "Allenamento"] : [`${value} kcal`, "Calorie"]
            }
          />
          <Bar dataKey="min" fill="#FF3B30" radius={[6, 6, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
