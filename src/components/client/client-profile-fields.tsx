"use client";

import { useState } from "react";
import { completeClientProfile } from "@/app/profile-setup/actions";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { useT } from "@/lib/i18n/client";

const SEXES = [
  { value: "Uomo", key: "pf.man" },
  { value: "Donna", key: "pf.woman" },
];
// value = canonico salvato nel DB, key = etichetta tradotta
const GOALS = [
  { value: "Dimagrimento", key: "goal.loss" },
  { value: "Massa muscolare", key: "goal.mass" },
  { value: "Forza", key: "goal.strength" },
  { value: "Tonificazione", key: "goal.tone" },
  { value: "Resistenza", key: "goal.endurance" },
  { value: "Salute generale", key: "goal.health" },
];

export type ProfileInitial = {
  sex?: string;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  days?: number | null;
  goals?: string[];
  notes?: string | null;
};

export function ClientProfileFields({
  initial,
  submitLabel,
  onSaved,
}: {
  initial?: ProfileInitial;
  submitLabel: string;
  onSaved?: () => void;
}) {
  const { t } = useT();
  const [sex, setSex] = useState(initial?.sex ?? "");
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [height, setHeight] = useState(initial?.height ? String(initial.height) : "");
  const [weight, setWeight] = useState(initial?.weight ? String(initial.weight) : "");
  const [days, setDays] = useState(initial?.days ?? 3);
  const [goals, setGoals] = useState<string[]>(initial?.goals ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleGoal(g: string) {
    setGoals((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));
  }

  async function submit() {
    setError(null);
    setSaved(false);
    if (!sex) return setError(t("pf.errSex"));
    if (!height || !weight) return setError(t("pf.errHW"));
    if (goals.length === 0) return setError(t("pf.errGoals"));

    setSaving(true);
    const res = await completeClientProfile({
      sex,
      age: age ? Number(age) : null,
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
      goals,
      trainingDaysPerWeek: days,
      notes,
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onSaved?.();
    } else {
      setError(res.error ?? "Errore. Riprova.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Sesso */}
      <div className="rounded-3xl glass p-5">
        <p className="font-semibold text-slate-800 mb-3">{t("pf.sex")}</p>
        <div className="flex gap-2">
          {SEXES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSex(s.value)}
              className={`flex-1 rounded-2xl py-3 font-medium transition-colors ${
                sex === s.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t(s.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Dati fisici */}
      <div className="rounded-3xl glass p-5">
        <p className="font-semibold text-slate-800 mb-3">{t("pf.data")}</p>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col">
            <span className="text-xs text-slate-400 mb-1.5">{t("pf.age")}</span>
            <input
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="30"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-slate-400 mb-1.5">{t("pf.height")}</span>
            <input
              type="number"
              inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="178"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-slate-400 mb-1.5">{t("pf.weight")}</span>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-brand"
            />
          </label>
        </div>
      </div>

      {/* Giorni */}
      <div className="rounded-3xl glass p-5">
        <p className="font-semibold text-slate-800 mb-1">{t("pf.daysQ")}</p>
        <p className="text-xs text-slate-400 mb-3">{t("pf.daysHint")}</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setDays(n)}
              className={`h-12 w-12 rounded-2xl text-base font-bold transition-colors ${
                days === n ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Obiettivi */}
      <div className="rounded-3xl glass p-5">
        <p className="font-semibold text-slate-800 mb-1">{t("pf.goals")}</p>
        <p className="text-xs text-slate-400 mb-3">{t("pf.goalsHint")}</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              onClick={() => toggleGoal(g.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                goals.includes(g.value)
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {goals.includes(g.value) && <Check className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />}
              {t(g.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="rounded-3xl glass p-5">
        <p className="font-semibold text-slate-800 mb-1">{t("pf.notes")}</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={t("pf.notesPh")}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand resize-none"
        />
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-brand">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {saved && !error && (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
          <Check className="h-4 w-4 shrink-0" /> {t("pf.saved")}
        </p>
      )}

      <button
        onClick={submit}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 font-semibold text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {saving ? t("session.saving") : submitLabel}
      </button>
    </div>
  );
}
