"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutPlan, updateWorkoutPlan, type DayInput } from "../actions";
import { Plus, Trash2, GripVertical, AlertCircle, ArrowLeft, StickyNote } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { PlanTypePicker, typeUsesWeight, type PlanType } from "@/components/trainer/plan-type-picker";

type ClientOption = { id: string; name: string };

let uid = 0;
const newId = () => `tmp-${uid++}`;

type ExRow = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
  restSeconds: string;
  notes: string;
};
type DayCard = { id: string; name: string; weekday: number | null; exercises: ExRow[] };

function emptyExercise(): ExRow {
  return { id: newId(), name: "", sets: "3", reps: "10", weight: "", restSeconds: "60", notes: "" };
}
function emptyDay(): DayCard {
  return { id: newId(), name: "", weekday: null, exercises: [emptyExercise()] };
}

function toDayCards(days?: DayInput[]): DayCard[] {
  if (!days || days.length === 0) return [emptyDay()];
  return days.map((d) => ({
    id: newId(),
    name: d.name,
    weekday: d.weekday ?? null,
    exercises:
      d.exercises.length > 0
        ? d.exercises.map((e) => ({
            id: newId(),
            name: e.name,
            sets: String(e.sets),
            reps: e.reps,
            weight: e.weight != null ? String(e.weight) : "",
            restSeconds: String(e.restSeconds),
            notes: e.notes ?? "",
          }))
        : [emptyExercise()],
  }));
}

export function WorkoutBuilder({
  clients,
  planId,
  initialClientId,
  initialName = "",
  initialPlanType = "WEIGHTS",
  initialDescription = "",
  initialDurationWeeks,
  initialStartDate,
  initialDays,
  onBack,
}: {
  clients: ClientOption[];
  planId?: string;
  initialClientId?: string;
  initialName?: string;
  initialPlanType?: PlanType;
  initialDescription?: string;
  initialDurationWeeks?: number | null;
  initialStartDate?: string;
  initialDays?: DayInput[];
  onBack?: () => void;
}) {
  const router = useRouter();
  const { t } = useT();
  const isEdit = !!planId;
  const [clientId, setClientId] = useState(initialClientId ?? clients[0]?.id ?? "");
  const [planType, setPlanType] = useState<PlanType>(initialPlanType);
  const showWeight = typeUsesWeight(planType);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [durationWeeks, setDurationWeeks] = useState(
    initialDurationWeeks ? String(initialDurationWeeks) : ""
  );
  const [startDate, setStartDate] = useState(
    initialStartDate ?? new Date().toISOString().slice(0, 10)
  );

  // Anteprima data di fine
  const endPreview =
    durationWeeks && Number(durationWeeks) > 0
      ? new Date(
          new Date(startDate).getTime() + Number(durationWeeks) * 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })
      : null;
  const [days, setDays] = useState<DayCard[]>(toDayCards(initialDays));
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDay = days[Math.min(active, days.length - 1)];

  function updateDay(id: string, patch: Partial<DayCard>) {
    setDays((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }
  function updateExercise(dayId: string, exId: string, patch: Partial<ExRow>) {
    setDays((ds) =>
      ds.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) }
          : d
      )
    );
  }
  function addExercise(dayId: string) {
    setDays((ds) =>
      ds.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d))
    );
  }
  function removeExercise(dayId: string, exId: string) {
    setDays((ds) =>
      ds.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d
      )
    );
  }
  function addDay() {
    setDays((ds) => {
      const next = [...ds, emptyDay()];
      setActive(next.length - 1);
      return next;
    });
  }
  function removeDay(id: string) {
    setDays((ds) => {
      const next = ds.filter((d) => d.id !== id);
      setActive((a) => Math.max(0, Math.min(a, next.length - 1)));
      return next.length ? next : [emptyDay()];
    });
  }

  async function save() {
    setError(null);
    if (!name.trim()) return setError(t("err.noName"));

    setSaving(true);
    const payload = {
      clientId: clientId || null,
      name,
      planType,
      description,
      durationWeeks: durationWeeks.trim() === "" ? null : Number(durationWeeks),
      startDate,
      days: days.map((d) => ({
        name: d.name,
        weekday: d.weekday,
        exercises: d.exercises.map((e) => ({
          name: e.name,
          sets: e.sets.trim() === "" ? 0 : Number(e.sets),
          reps: e.reps,
          weight: showWeight && e.weight.trim() !== "" ? Number(e.weight) : null,
          restSeconds: e.restSeconds.trim() === "" ? 0 : Number(e.restSeconds),
          notes: e.notes,
        })),
      })),
    };
    const res = isEdit
      ? await updateWorkoutPlan(planId!, payload)
      : await createWorkoutPlan(payload);
    setSaving(false);
    if (res.ok) {
      router.push("/trainer/workouts");
      router.refresh();
    } else {
      setError(res.error ?? t("err.save"));
    }
  }

  return (
    <div className="space-y-6 pb-28 lg:pb-10">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" /> {t("wb.editSettings")}
        </button>
      )}

      {/* Dati scheda */}
      <div className="rounded-3xl glass p-5 sm:p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">{t("wk.planType")}</label>
          <div className="mt-2">
            <PlanTypePicker value={planType} onChange={setPlanType} />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">{t("wb.assign")}</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">{t("wb.noClient")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            {t("wb.templateHint")}
          </p>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">{t("wb.name")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("wb.namePh")}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="text-sm font-semibold text-slate-700">{t("wb.startDate")}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="min-w-0">
            <label className="text-sm font-semibold text-slate-700">{t("wb.duration")}</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              placeholder="Es. 6"
              className="mt-2 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>
        {endPreview && (
          <p className="text-xs text-slate-400 -mt-1">{t("wb.endPreview", { date: endPreview })}</p>
        )}
        <div>
          <label className="text-sm font-semibold text-slate-700">{t("wb.desc")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={t("wb.descPh")}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
          />
        </div>
      </div>

      {/* Tab giorni (orizzontali) */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              i === active
                ? "bg-brand text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t("plan.dayN", { n: i + 1 })}
          </button>
        ))}
        <button
          onClick={addDay}
          className="shrink-0 flex items-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:border-slate-400 hover:text-slate-700"
        >
          <Plus className="h-4 w-4" /> {t("wb.addDay")}
        </button>
      </div>

      {/* Editor del giorno attivo */}
      {activeDay && (
        <div className="rounded-3xl glass p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 min-w-9 px-2 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shrink-0">
              {active + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400">{t("plan.dayN", { n: active + 1 })}</p>
              <input
                value={activeDay.name}
                onChange={(e) => updateDay(activeDay.id, { name: e.target.value })}
                placeholder={t("wb.dayNamePh")}
                className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none placeholder:text-slate-300"
              />
            </div>
            {days.length > 1 && (
              <button
                onClick={() => removeDay(activeDay.id)}
                className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-500"
                aria-label="Rimuovi giorno"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("wb.delDay")}
              </button>
            )}
          </div>

          {/* Giorno della settimana (opzionale): aggancia l'allenamento al calendario */}
          <div className="mb-4">
            <p className="text-[11px] text-slate-400 mb-1.5">{t("wb.weekday")}</p>
            <div className="flex gap-1.5">
              {t("dash.weekInitials").split(",").map((label, i) => {
                const wd = i + 1; // 1=Lun..7=Dom
                const selected = activeDay.weekday === wd;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => updateDay(activeDay.id, { weekday: selected ? null : wd })}
                    className={`h-9 flex-1 rounded-xl text-xs font-bold transition-colors ${
                      selected ? "bg-brand text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Esercizi */}
          <div className="space-y-2">
            {activeDay.exercises.map((ex) => (
              <div key={ex.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                  <input
                    value={ex.name}
                    onChange={(e) => updateExercise(activeDay.id, ex.id, { name: e.target.value })}
                    placeholder={t("wb.exPh")}
                    className="flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => removeExercise(activeDay.id, ex.id)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:text-red-500"
                    aria-label="Rimuovi esercizio"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className={`mt-2 grid grid-cols-2 gap-2 pl-6 ${showWeight ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
                  <label className="flex flex-col">
                    <span className="text-[11px] text-slate-400 mb-1">{t("wb.sets")}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={ex.sets}
                      onChange={(e) => updateExercise(activeDay.id, ex.id, { sets: e.target.value })}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-[11px] text-slate-400 mb-1">
                      {planType === "SWIMMING" ? t("wb.repsSwim") : t("wb.reps")}
                    </span>
                    <input
                      value={ex.reps}
                      onChange={(e) => updateExercise(activeDay.id, ex.id, { reps: e.target.value })}
                      placeholder={planType === "SWIMMING" ? "4 × 50m" : "8-12"}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand"
                    />
                  </label>
                  {showWeight && (
                    <label className="flex flex-col">
                      <span className="text-[11px] text-slate-400 mb-1">{t("wb.weight")}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.5}
                        value={ex.weight}
                        onChange={(e) => updateExercise(activeDay.id, ex.id, { weight: e.target.value })}
                        placeholder="—"
                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand"
                      />
                    </label>
                  )}
                  <label className="flex flex-col">
                    <span className="text-[11px] text-slate-400 mb-1">{t("wb.rest")}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={15}
                      value={ex.restSeconds}
                      onChange={(e) => updateExercise(activeDay.id, ex.id, { restSeconds: e.target.value })}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand"
                    />
                  </label>
                </div>

                {/* Note libere per l'esercizio (tecnica, tempo, RPE, cue...) */}
                <div className="mt-2 pl-6">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                    <StickyNote className="h-3 w-3" /> {t("wb.notes")}
                  </div>
                  <textarea
                    value={ex.notes}
                    onChange={(e) => updateExercise(activeDay.id, ex.id, { notes: e.target.value })}
                    rows={2}
                    placeholder={t("wb.notesPh")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-brand resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addExercise(activeDay.id)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-2.5 text-sm font-medium text-slate-400 hover:border-brand/40 hover:text-brand"
          >
            <Plus className="h-4 w-4" /> {t("wb.addEx")}
          </button>
        </div>
      )}

      {/* Salvataggio — in fondo al contenuto (appare scrollando, non fisso) */}
      <div className="space-y-3 pt-2">
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-brand">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-full bg-brand py-4 font-semibold text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {saving ? t("session.saving") : isEdit ? t("wb.saveEdits") : t("wb.save")}
        </button>
      </div>
    </div>
  );
}
