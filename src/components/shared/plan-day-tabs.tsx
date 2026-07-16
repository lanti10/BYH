"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell, Play, ChevronRight, X, StickyNote, Timer, Check, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import { estimateDuration } from "@/lib/workout";
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
  weekday?: number | null; // 1=Lun..7=Dom, se pianificato
  durationMin?: number | null; // durata impostata dal trainer; null = stima automatica
  exercises: PlanExercise[];
};
// Peso registrato dal cliente su un esercizio (storico, dal più recente)
export type WeightEntry = { weight: number; date: string };

export function PlanDayTabs({
  days,
  startHrefBase,
  todayIndex,
  planType = "WEIGHTS",
  editableWeight = false,
  weightHistory,
}: {
  days: PlanDay[];
  startHrefBase?: string;
  todayIndex?: number; // giorno che tocca oggi (progressione): tab pre-selezionata + badge "Oggi"
  planType?: PlanType;
  editableWeight?: boolean; // il cliente può aggiornare il peso che usa davvero
  weightHistory?: Record<string, WeightEntry[]>; // per id esercizio, dal più recente
}) {
  const { t } = useT();
  const [active, setActive] = useState(
    todayIndex != null ? Math.min(todayIndex, Math.max(days.length - 1, 0)) : 0
  );
  const [detailId, setDetailId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, WeightEntry[]>>(weightHistory ?? {});

  if (days.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">{t("plan.noDays")}</p>;
  }

  const day = days[Math.min(active, days.length - 1)];
  const showWeight = planType === "WEIGHTS";
  const weekInitials = t("dash.weekInitials").split(",");
  const weekdayLabel = (wd?: number | null) =>
    wd != null && wd >= 1 && wd <= 7 ? weekInitials[wd - 1] : null;

  // Peso da mostrare: quello registrato dal cliente se c'è, altrimenti la prescrizione del trainer
  const currentWeight = (ex: PlanExercise) =>
    (editableWeight ? logs[ex.id]?.[0]?.weight : undefined) ?? ex.weight;

  const detail = day.exercises.find((e) => e.id === detailId) ?? null;

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
            {weekdayLabel(d.weekday) && (
              <span
                className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  i === active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {weekdayLabel(d.weekday)}
              </span>
            )}
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

      {/* Durata allenamento (manuale se impostata, altrimenti stima) */}
      {day.exercises.length > 0 && (
        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <Timer className="h-4 w-4 text-slate-400" />
          <span className="tnum">
            {day.durationMin ?? estimateDuration(day.exercises)} {t("dash.min")}
          </span>
        </div>
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
        {day.exercises.map((ex, i) => {
          const w = currentWeight(ex);
          return (
            <button
              key={ex.id}
              onClick={() => setDetailId(ex.id)}
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
                  {showWeight && w != null ? ` · ${w} kg` : ""} · {ex.restSeconds}s{" "}
                  {t("plan.rest")}
                </p>
              </div>
              {ex.notes?.trim() && (
                <StickyNote className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          );
        })}
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
          editable={editableWeight && showWeight}
          history={logs[detail.id] ?? []}
          onSaved={(entry) =>
            setLogs((m) => ({ ...m, [detail.id]: [entry, ...(m[detail.id] ?? [])] }))
          }
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

// Bottom sheet con tutti i dettagli di un esercizio (chiaro, per la vista scheda)
function ExerciseDetailSheet({
  ex,
  showWeight,
  editable,
  history,
  onSaved,
  onClose,
}: {
  ex: PlanExercise;
  showWeight: boolean;
  editable: boolean;
  history: WeightEntry[];
  onSaved: (entry: WeightEntry) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  // Quando il peso è modificabile ha una card dedicata, quindi esce dalla griglia
  const stats: { label: string; value: string }[] = [
    { label: t("wb.sets"), value: String(ex.sets) },
    { label: t("wb.reps"), value: ex.reps },
    ...(showWeight && !editable
      ? [{ label: t("wb.weight"), value: ex.weight != null ? `${ex.weight}` : "—" }]
      : []),
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

        {editable && <WeightEditor ex={ex} history={history} onSaved={onSaved} />}

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

// Casella peso modificabile dal cliente + storico degli aggiornamenti
function WeightEditor({
  ex,
  history,
  onSaved,
}: {
  ex: PlanExercise;
  history: WeightEntry[];
  onSaved: (entry: WeightEntry) => void;
}) {
  const { t, locale } = useT();
  const dl = DATE_LOCALE[locale];
  const current = history[0]?.weight ?? ex.weight;
  const [value, setValue] = useState(current != null ? String(current) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const dirty = value.trim() !== "" && Number(value) !== current;

  async function save() {
    const w = Number(value);
    if (!Number.isFinite(w) || w < 0 || w > 1000) {
      setError(t("plan.weightInvalid"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/exercise-weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutExerciseId: ex.id, weight: w }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onSaved({ weight: data.weight, date: data.date });
      setValue(String(data.weight));
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch {
      setError(t("plan.weightErr"));
    } finally {
      setSaving(false);
    }
  }

  // Andamento: differenza tra il peso attuale e quello registrato prima
  const prev = history[1]?.weight ?? null;
  const delta = prev != null && history[0] ? history[0].weight - prev : null;

  return (
    <div className="mt-2.5 rounded-2xl bg-slate-50 p-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">{t("plan.myWeight")}</span>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={1000}
              step={0.5}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="20"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-base font-bold text-slate-900 tnum outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              kg
            </span>
          </div>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex h-[46px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-40 disabled:shadow-none"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : ok ? (
              <Check className="h-4 w-4" />
            ) : (
              t("plan.weightSave")
            )}
          </button>
        </div>
      </label>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-brand">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {/* Prescrizione del trainer, come riferimento */}
      {ex.weight != null && (
        <p className="mt-2.5 text-xs text-slate-400 tnum">
          {t("plan.coachWeight", { w: ex.weight })}
        </p>
      )}

      {/* Storico aggiornamenti */}
      {history.length > 0 && (
        <div className="mt-3 border-t border-black/5 pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> {t("plan.weightHistory")}
            {delta != null && delta !== 0 && (
              <span className={delta > 0 ? "text-emerald-600 tnum" : "text-slate-400 tnum"}>
                {delta > 0 ? "+" : ""}
                {Math.round(delta * 100) / 100} kg
              </span>
            )}
          </div>
          <div className="space-y-1">
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs tnum">
                <span className="text-slate-400">
                  {new Date(h.date).toLocaleDateString(dl, { day: "numeric", month: "short" })}
                </span>
                <span className={`font-semibold ${i === 0 ? "text-slate-900" : "text-slate-400"}`}>
                  {h.weight} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
