"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell, Play, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export type PlanExercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  restSeconds: number;
};
export type PlanDay = {
  id: string;
  name: string;
  exercises: PlanExercise[];
};

export function PlanDayTabs({
  days,
  startHrefBase,
  todayIndex,
}: {
  days: PlanDay[];
  startHrefBase?: string;
  todayIndex?: number; // giorno che tocca oggi (progressione): tab pre-selezionata + badge "Oggi"
}) {
  const { t } = useT();
  const [active, setActive] = useState(
    todayIndex != null ? Math.min(todayIndex, Math.max(days.length - 1, 0)) : 0
  );

  if (days.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">{t("plan.noDays")}</p>;
  }

  const day = days[Math.min(active, days.length - 1)];

  return (
    <div>
      {/* Tab giorni */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActive(i)}
            className={`relative shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              i === active
                ? "bg-brand text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t("plan.dayN", { n: i + 1 })}
            {todayIndex === i && (
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  i === active ? "bg-white/20 text-white" : "bg-brand/10 text-brand"
                }`}
              >
                {t("dash.today")}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Nome giorno */}
      {day.name && (
        <p className="mt-4 text-lg font-bold text-slate-900">{day.name}</p>
      )}

      {/* Inizia allenamento */}
      {startHrefBase && day.exercises.length > 0 && (
        <Link
          href={`${startHrefBase}/${day.id}`}
          className="mt-3 flex h-[50px] items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white shadow-cta transition-colors hover:bg-brand-hover"
        >
          <Play className="h-5 w-5 fill-white" /> {t("dash.start")}
        </Link>
      )}

      {/* Lista esercizi — list row dal design system (§04) */}
      <div className="mt-3 overflow-hidden rounded-3xl glass">
        {day.exercises.map((ex, i) => (
          <div
            key={ex.id}
            className={`flex items-center gap-3 px-4 py-3.5 ${
              i < day.exercises.length - 1 ? "border-b border-black/5" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-[13px] font-bold text-brand tnum">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{ex.name}</p>
              <p className="text-xs text-slate-500 tnum">
                {ex.sets} × {ex.reps}
                {ex.weight != null ? ` · ${ex.weight} kg` : ""} · {ex.restSeconds}s {t("plan.rest")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </div>
        ))}
        {day.exercises.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center text-slate-400">
            <Dumbbell className="h-6 w-6 mb-2" />
            <p className="text-sm">{t("plan.noExercises")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
