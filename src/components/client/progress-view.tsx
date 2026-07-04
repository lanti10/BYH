"use client";

import { useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell,
} from "recharts";
import { ActivityRings } from "./activity-rings";
import {
  Calendar, ChevronLeft, ChevronRight, Flame, Timer, Dumbbell, Heart,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";

export type Sess = {
  id: string;
  date: string; // ISO
  min: number;
  cal: number;
  hr: number | null;
  name: string;
};

type Mode = "day" | "week";

const DAY_MS = 86400000;
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
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
const toISODate = (d: Date) => {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export function ProgressView({ sessions, weeklyGoal }: { sessions: Sess[]; weeklyGoal: number }) {
  const { t, locale } = useT();
  const dl = DATE_LOCALE[locale];
  const [mode, setMode] = useState<Mode>("day");
  const [selected, setSelected] = useState<Date>(startOfDay(new Date()));
  const dateRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(
    () => sessions.map((s) => ({ ...s, d: new Date(s.date) })),
    [sessions]
  );

  // Intervallo attivo
  const rangeStart = mode === "day" ? startOfDay(selected) : mondayOf(selected);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeStart.getDate() + (mode === "day" ? 1 : 7));

  const inRange = parsed.filter((s) => s.d >= rangeStart && s.d < rangeEnd);
  const cal = inRange.reduce((a, s) => a + s.cal, 0);
  const min = inRange.reduce((a, s) => a + s.min, 0);
  const count = inRange.length;
  const hrVals = inRange.filter((s) => s.hr != null).map((s) => s.hr!);
  const avgHr = hrVals.length ? Math.round(hrVals.reduce((a, b) => a + b, 0) / hrVals.length) : null;

  // Obiettivi
  const g = weeklyGoal || 3;
  const calGoal = mode === "day" ? 400 : 400 * g;
  const minGoal = mode === "day" ? 45 : 45 * g;
  const wGoal = mode === "day" ? 1 : g;

  const rings = [
    { value: cal, goal: calGoal, color: "#FF375F", track: "rgba(255,55,95,.16)" },
    { value: min, goal: minGoal, color: "#30D158", track: "rgba(48,209,88,.16)" },
    { value: count, goal: wGoal, color: "#5AC8FA", track: "rgba(90,200,250,.16)" },
  ];

  // Grafico: 7 giorni della settimana che contiene `selected`
  const weekStart = mondayOf(selected);
  const chart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dayS = parsed.filter((s) => sameDay(s.d, d));
    return {
      label: t("dash.weekInitials").split(",")[i],
      min: dayS.reduce((a, s) => a + s.min, 0),
      isSel: mode === "day" && sameDay(d, selected),
      date: d,
    };
  });

  function shift(dir: number) {
    const d = new Date(selected);
    d.setDate(d.getDate() + dir * (mode === "day" ? 1 : 7));
    if (d <= startOfDay(new Date()) || dir < 0) setSelected(startOfDay(d));
  }

  const isToday = mode === "day" && sameDay(selected, new Date());
  const label =
    mode === "day"
      ? selected.toLocaleDateString(dl, { weekday: "long", day: "numeric", month: "long" })
      : `${rangeStart.toLocaleDateString(dl, { day: "numeric", month: "short" })} – ${new Date(rangeEnd.getTime() - DAY_MS).toLocaleDateString(dl, { day: "numeric", month: "short" })}`;

  const metrics = [
    { label: t("prog.move"), value: cal, goal: calGoal, unit: "CAL", color: "#FF375F", icon: Flame },
    { label: t("prog.exercise"), value: min, goal: minGoal, unit: "MIN", color: "#30D158", icon: Timer },
    { label: t("prog.workouts"), value: count, goal: wGoal, unit: t("prog.sessUnit"), color: "#5AC8FA", icon: Dumbbell },
  ];

  return (
    <div className="space-y-4">
      {/* Barra controlli: data + calendario + filtro */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => shift(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full glass text-slate-600 hover:bg-white"
            aria-label="Precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => shift(1)}
            disabled={isToday || (mode === "week" && rangeEnd > new Date())}
            className="flex h-9 w-9 items-center justify-center rounded-full glass text-slate-600 hover:bg-white disabled:opacity-30"
            aria-label="Successivo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="ml-2 text-sm font-semibold text-slate-900 capitalize">
            {isToday ? t("common.today") : label}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => (dateRef.current?.showPicker?.() ?? dateRef.current?.click())}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-cta"
            aria-label="Scegli data"
          >
            <Calendar className="h-4 w-4" />
          </button>
          <input
            ref={dateRef}
            type="date"
            max={toISODate(new Date())}
            value={toISODate(selected)}
            onChange={(e) => e.target.value && setSelected(startOfDay(new Date(e.target.value)))}
            className="absolute inset-0 h-full w-full opacity-0"
            tabIndex={-1}
          />
        </div>
      </div>

      {/* Segmented control giorno/settimana */}
      <div className="flex rounded-2xl bg-slate-100 p-1">
        {(["day", "week"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
              mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            {m === "day" ? t("prog.day") : t("prog.week")}
          </button>
        ))}
      </div>

      {/* Anelli di attività + legenda */}
      <div className="rounded-3xl bg-depth-dark p-5 sm:p-6 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/50 mb-4">
          {t("prog.rings")}
        </p>
        <div className="flex items-center gap-5 sm:gap-8">
          <div className="relative shrink-0">
            <ActivityRings rings={rings} size={168} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tnum leading-none">{count}</span>
              <span className="text-[10px] uppercase tracking-wide text-white/50">{t("prog.short")}</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="text-[13px] font-medium" style={{ color: m.color }}>
                  {m.label}
                </p>
                <p className="text-xl font-bold tnum leading-none">
                  {m.value}
                  <span className="text-sm font-medium text-white/40">/{m.goal} </span>
                  <span className="text-xs font-semibold text-white/40">{m.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metriche giornaliere in tessere */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-3xl glass p-4">
          <Flame className="h-5 w-5 text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900 tnum leading-none">{cal}</p>
          <p className="text-xs text-slate-400 mt-1">{t("prog.kcal")}</p>
        </div>
        <div className="rounded-3xl glass p-4">
          <Timer className="h-5 w-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900 tnum leading-none">{min}</p>
          <p className="text-xs text-slate-400 mt-1">{t("prog.minutes")}</p>
        </div>
        <div className="rounded-3xl glass p-4">
          <Heart className="h-5 w-5 text-brand mb-2" />
          <p className="text-2xl font-bold text-slate-900 tnum leading-none">{avgHr ?? "—"}</p>
          <p className="text-xs text-slate-400 mt-1">{t("prog.avgBpm")}</p>
        </div>
      </div>

      {/* Grafico settimanale */}
      <div className="rounded-3xl glass p-5 sm:p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-slate-900">{t("prog.chart")}</h2>
          <span className="text-xs text-slate-400 tnum">
            {weekStart.toLocaleDateString(dl, { day: "numeric", month: "short" })}
          </span>
        </div>
        <div className="h-40 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8E8E93" }} />
              <Tooltip
                cursor={{ fill: "rgba(255,59,48,.06)" }}
                contentStyle={{ borderRadius: 14, border: "1px solid rgba(0,0,0,.06)", fontSize: 12 }}
                formatter={(v: number) => [`${v} min`, t("prog.oneSession")]}
                labelFormatter={() => ""}
              />
              <Bar dataKey="min" radius={[6, 6, 0, 0]} maxBarSize={26}>
                {chart.map((c, i) => (
                  <Cell key={i} fill={c.isSel ? "#FF3B30" : "rgba(255,59,48,.35)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sessioni del periodo */}
      <div className="rounded-3xl glass p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 mb-3">
          {mode === "day" ? t("prog.oneSession") : t("prog.weekSessions")}
        </h2>
        {inRange.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            {mode === "day" ? t("prog.emptyDay") : t("prog.emptyWeek")}
          </p>
        ) : (
          <div className="space-y-2">
            {inRange
              .slice()
              .sort((a, b) => b.d.getTime() - a.d.getTime())
              .map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white/60 p-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Dumbbell className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{s.name || t("prog.oneSession")}</p>
                    <p className="text-xs text-slate-400 tnum">
                      {s.d.toLocaleDateString(dl, { day: "numeric", month: "short" })} ·{" "}
                      {s.d.toLocaleTimeString(dl, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600 tnum leading-none">{s.cal}</p>
                    <p className="text-[11px] font-semibold uppercase text-slate-400">{t("prog.cal")}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
