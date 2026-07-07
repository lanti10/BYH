"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell, Play, ChevronRight, X, StickyNote } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { PlanType } from "@/components/trainer/plan-type-picker";

export type PlanExercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  restSeconds: number;
  notes?: string | null;
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
  planType = "WEIGHTS",
}: {
  days: PlanDay[];
  startHrefBase?: string;
  todayIndex?: number; // giorno che tocca oggi (progressione): tab pre-selezionata + badge "Oggi"
  planType?: PlanType;
}) {
  const { t } = useT();
  const [active, setActive] = useState(
    todayIndex != null ? Math.min(todayIndex, Math.max(days.length - 1, 0)) : 0
  );
  const [detail, setDetail] = useState<PlanExercise | null>(null);

  if (days.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">{t("plan.noDays")}</p>;
  }

  const day = days[Math.min(active, days.length - 1)];
  const showWeight = planType === "WEIGHTS";

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

      {/* Lista esercizi — list row dal design system (§04); tap = dettaglio */}
      <div className="mt-3 overflow-hidden rounded-3xl glass">
        {day.exercises.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => setDetail(ex)}
            className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.02] ${
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
                {showWeight && ex.weight != null ? ` · ${ex.weight} kg` : ""} · {ex.restSeconds}s{" "}
                {t("plan.rest")}
              </p>
            </div>
            {ex.notes?.trim() && (
              <StickyNote className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            )}
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </button>
        ))}
        {day.exercises.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center text-slate-400">
            <Dumbbell className="h-6 w-6 mb-2" />
            <p className="text-sm">{t("plan.noExercises")}</p>
          </div>
        )}
      </div>

      {/* Sheet dettaglio esercizio */}
      {detail && (
        <ExerciseDetailSheet
          ex={detail}
          showWeight={showWeight}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

// Bottom sheet con tutti i dettagli di un esercizio (chiaro, per la vista scheda)
function ExerciseDetailSheet({
  ex,
  showWeight,
  onClose,
}: {
  ex: PlanExercise;
  showWeight: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const stats: { label: string; value: string }[] = [
    { label: t("wb.sets"), value: String(ex.sets) },
    { label: t("wb.reps"), value: ex.reps },
    ...(showWeight ? [{ label: t("wb.weight"), value: ex.weight != null ? `${ex.weight}` : "—" }] : []),
    { label: t("wb.rest"), value: `${ex.restSeconds}` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl glass-prominent p-6 pb-8 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <h3 className="text-lg font-bold text-slate-900">{ex.name}</h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-lg font-bold text-slate-900 tnum">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-1.5 mb-1.5 text-sm font-semibold text-slate-700">
            <StickyNote className="h-4 w-4 text-brand" /> {t("plan.notes")}
          </div>
          {ex.notes?.trim() ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 whitespace-pre-wrap">
              {ex.notes}
            </p>
          ) : (
            <p className="text-sm text-slate-400">{t("plan.noNotes")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
