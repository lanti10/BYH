"use client";

import { useMemo, useState } from "react";
import { ActivityRings } from "@/components/client/activity-rings";
import { useT } from "@/lib/i18n/client";

// Anelli attività del PT con toggle Oggi / Settimana.
// La settimana è lun–dom (si azzera ogni lunedì 00:00), come per il cliente.
type Sess = { ts: number; min: number; cal: number };
type Mode = "day" | "week";

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const mondayOf = (d: Date) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

export function WorkoutRings({
  sessions,
  weeklyGoal,
  planMin,
  planCal,
}: {
  sessions: Sess[];
  weeklyGoal: number;
  planMin: number; // durata obiettivo per allenamento (dalla scheda, con fallback)
  planCal: number; // calorie obiettivo per allenamento (dalla scheda, con fallback)
}) {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>("day");

  const { cal, min, count } = useMemo(() => {
    const from = (mode === "day" ? startOfDay(new Date()) : mondayOf(new Date())).getTime();
    const inRange = sessions.filter((s) => s.ts >= from);
    return {
      cal: inRange.reduce((a, s) => a + s.cal, 0),
      min: inRange.reduce((a, s) => a + s.min, 0),
      count: inRange.length,
    };
  }, [sessions, mode]);

  const g = weeklyGoal || 3;
  const calGoal = mode === "day" ? planCal : planCal * g;
  const minGoal = mode === "day" ? planMin : planMin * g;
  const wGoal = mode === "day" ? 1 : g;

  const rings = [
    { value: cal, goal: calGoal, color: "#FF375F", track: "#FF375F22", label: t("session.calories"), display: `${cal}/${calGoal}` },
    { value: min, goal: minGoal, color: "#30D158", track: "#30D15822", label: t("dash.activeTime"), display: `${min}/${minGoal} ${t("dash.min")}` },
    { value: count, goal: wGoal, color: "#5AC8FA", track: "#5AC8FA22", label: t("dash.workoutsLabel"), display: `${count}/${wGoal}` },
  ];

  return (
    <div className="rounded-3xl glass p-5 sm:p-6">
      {/* Segmented Oggi / Settimana */}
      <div className="mb-5 flex rounded-2xl bg-slate-100 p-1">
        {(["day", "week"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
              mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            {m === "day" ? t("common.today") : t("prog.week")}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-5 sm:gap-8">
        <ActivityRings rings={rings} size={140} />
        <div className="flex-1 space-y-3">
          {rings.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: r.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-slate-900 leading-none tnum">{r.display}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
