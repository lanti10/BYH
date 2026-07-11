"use client";

import { useMemo, useState } from "react";
import { Dumbbell, Flame, Timer, Heart, X, StickyNote } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import type { PlanType } from "@/components/trainer/plan-type-picker";

export type HistExercise = {
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  restSeconds: number;
  notes?: string | null;
};
export type HistSession = {
  id: string;
  date: string; // ISO
  name: string;
  min: number;
  cal: number;
  hr: number | null;
  planType: PlanType;
  exercises: HistExercise[];
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function SessionHistory({ sessions }: { sessions: HistSession[] }) {
  const { t, locale } = useT();
  const dl = DATE_LOCALE[locale];
  const [detail, setDetail] = useState<HistSession | null>(null);

  // Raggruppa per mese (dal più recente), ogni gruppo ordinato dal più recente.
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; sort: number; items: HistSession[] }>();
    for (const s of sessions) {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) {
        map.set(key, {
          label: cap(d.toLocaleDateString(dl, { month: "long", year: "numeric" })),
          sort: d.getFullYear() * 12 + d.getMonth(),
          items: [],
        });
      }
      map.get(key)!.items.push(s);
    }
    return [...map.values()]
      .sort((a, b) => b.sort - a.sort)
      .map((g) => ({
        ...g,
        items: g.items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }));
  }, [sessions, dl]);

  if (sessions.length === 0) {
    return (
      <div className="rounded-3xl glass p-10 text-center">
        <Dumbbell className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm text-slate-400">{t("hist.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {groups.map((g) => (
        <section key={g.label}>
          <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-slate-400">
            {g.label} <span className="tnum text-slate-300">· {g.items.length}</span>
          </h2>
          {/* Fiches orizzontali scorrevoli */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-1 sm:px-1">
            {g.items.map((s) => {
              const d = new Date(s.date);
              return (
                <button
                  key={s.id}
                  onClick={() => setDetail(s)}
                  className="group flex w-40 shrink-0 flex-col rounded-3xl glass p-4 text-left transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Dumbbell className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold tnum text-slate-400">
                      {d.toLocaleDateString(dl, { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-900">
                    {s.name || t("prog.oneSession")}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 tnum">
                      <Flame className="h-3.5 w-3.5 text-orange-500" />
                      {s.cal}
                    </span>
                    <span className="flex items-center gap-1 tnum">
                      <Timer className="h-3.5 w-3.5 text-blue-500" />
                      {s.min}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {detail && <SessionDetailSheet s={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function SessionDetailSheet({ s, onClose }: { s: HistSession; onClose: () => void }) {
  const { t, locale } = useT();
  const dl = DATE_LOCALE[locale];
  const d = new Date(s.date);
  const showWeight = s.planType === "WEIGHTS";

  const metrics: { icon: typeof Flame; tint: string; value: string; label: string }[] = [
    { icon: Flame, tint: "text-orange-500", value: String(s.cal), label: t("prog.kcal") },
    { icon: Timer, tint: "text-blue-500", value: String(s.min), label: t("prog.minutes") },
    { icon: Heart, tint: "text-brand", value: s.hr != null ? String(s.hr) : "—", label: t("prog.avgBpm") },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl glass-prominent p-6 pb-8 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{s.name || t("prog.oneSession")}</h3>
            <p className="mt-0.5 text-sm capitalize text-slate-400 tnum">
              {d.toLocaleDateString(dl, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
              {d.toLocaleTimeString(dl, { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
              <m.icon className={`mx-auto mb-1 h-4 w-4 ${m.tint}`} />
              <p className="text-lg font-bold text-slate-900 tnum leading-none">{m.value}</p>
              <p className="mt-1 text-[11px] text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-slate-700">{t("session.exercises")}</p>
          {s.exercises.length === 0 ? (
            <p className="text-sm text-slate-400">{t("plan.noExercises")}</p>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-slate-50">
              {s.exercises.map((ex, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < s.exercises.length - 1 ? "border-b border-black/5" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-[13px] font-bold text-brand tnum">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{ex.name}</p>
                    <p className="text-xs text-slate-500 tnum">
                      {ex.sets} × {ex.reps}
                      {showWeight && ex.weight != null ? ` · ${ex.weight} kg` : ""}
                    </p>
                  </div>
                  {ex.notes?.trim() && <StickyNote className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
