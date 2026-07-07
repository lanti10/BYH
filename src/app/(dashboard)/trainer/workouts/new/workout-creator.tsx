"use client";

import { useRef, useState } from "react";
import { WorkoutBuilder } from "./workout-builder";
import type { DayInput } from "../actions";
import { Sparkles, PencilLine, AlertCircle, Loader2, Upload } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { PlanTypePicker, type PlanType } from "@/components/trainer/plan-type-picker";

export type ClientOption = {
  id: string;
  name: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  goals?: string | null;
};

// value = canonico (inviato all'AI), key = etichetta tradotta
const TRAINING_TYPES = [
  { value: "Ipertrofia / Massa", key: "tt.mass" },
  { value: "Forza", key: "tt.strength" },
  { value: "Dimagrimento", key: "tt.loss" },
  { value: "Resistenza", key: "tt.endurance" },
  { value: "Tonificazione", key: "tt.tone" },
  { value: "Functional / Full body", key: "tt.functional" },
];
const LEVELS = [
  { value: "Principiante", key: "lvl.beginner" },
  { value: "Intermedio", key: "lvl.intermediate" },
  { value: "Avanzato", key: "lvl.advanced" },
];
const SEXES = [
  { value: "Uomo", key: "pf.man" },
  { value: "Donna", key: "pf.woman" },
];

export function WorkoutCreator({
  clients,
  initialClientId,
}: {
  clients: ClientOption[];
  initialClientId?: string;
}) {
  const { t } = useT();
  const [phase, setPhase] = useState<"config" | "edit">("config");

  const [planType, setPlanType] = useState<PlanType>("WEIGHTS");
  const [clientId, setClientId] = useState(
    initialClientId && clients.some((c) => c.id === initialClientId)
      ? initialClientId
      : clients[0]?.id ?? ""
  );
  const [trainingType, setTrainingType] = useState(TRAINING_TYPES[0].value);
  const [frequency, setFrequency] = useState(3);
  const [sex, setSex] = useState("");
  const [age, setAge] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [level, setLevel] = useState(LEVELS[1].value);
  const [goals, setGoals] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDays, setGeneratedDays] = useState<DayInput[] | undefined>(undefined);

  // Import da file (PDF/foto/CSV): dati estratti che precompilano il builder
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importedName, setImportedName] = useState<string | null>(null);
  const [importedDuration, setImportedDuration] = useState<number | null>(null);

  function selectClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (c) {
      if (c.age) setAge(String(c.age));
      if (c.weight) setWeight(String(c.weight));
      if (c.height) setHeight(String(c.height));
      if (c.goals) setGoals(c.goals);
    }
  }

  const ttKey = TRAINING_TYPES.find((x) => x.value === trainingType)?.key;
  const suggestedName = t("wk.nameSuggestion", { type: t(ttKey ?? trainingType), n: frequency });

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workouts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          trainingType,
          frequency,
          sex,
          age: age ? Number(age) : undefined,
          weight: weight ? Number(weight) : undefined,
          height: height ? Number(height) : undefined,
          level,
          goals,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("err.gen"));
        return;
      }
      setGeneratedDays(data.days as DayInput[]);
      setPhase("edit");
    } catch {
      setError(t("err.conn"));
    } finally {
      setLoading(false);
    }
  }

  function manual() {
    setGeneratedDays(undefined);
    setImportedName(null);
    setImportedDuration(null);
    setPhase("edit");
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permette di ricaricare lo stesso file
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/workouts/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("err.gen"));
        return;
      }
      if (data.planType) setPlanType(data.planType as PlanType);
      setImportedName(typeof data.name === "string" && data.name.trim() ? data.name : null);
      setImportedDuration(typeof data.durationWeeks === "number" ? data.durationWeeks : null);
      setGeneratedDays(data.days as DayInput[]);
      setPhase("edit");
    } catch {
      setError(t("err.conn"));
    } finally {
      setImporting(false);
    }
  }

  if (phase === "edit") {
    return (
      <WorkoutBuilder
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        initialClientId={clientId}
        initialName={importedName ?? suggestedName}
        initialPlanType={planType}
        initialDurationWeeks={importedDuration}
        initialDays={generatedDays}
        onBack={() => setPhase("config")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tipo di scheda: con pesi / corpo libero / nuoto */}
      <div className="rounded-3xl glass p-5 sm:p-6">
        <h2 className="font-semibold text-slate-800 mb-3">{t("wk.planType")}</h2>
        <PlanTypePicker value={planType} onChange={setPlanType} />
      </div>

      {/* Tipo di allenamento */}
      <div className="rounded-3xl glass p-5 sm:p-6">
        <h2 className="font-semibold text-slate-800 mb-3">{t("wk.type")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRAINING_TYPES.map((tt) => (
            <button
              key={tt.value}
              onClick={() => setTrainingType(tt.value)}
              className={`rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                trainingType === tt.value
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t(tt.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Frequenza */}
      <div className="rounded-3xl glass p-5 sm:p-6">
        <h2 className="font-semibold text-slate-800 mb-3">{t("wk.freq")}</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setFrequency(n)}
              className={`h-12 w-12 rounded-2xl text-base font-bold transition-colors ${
                frequency === n
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Dati fisici */}
      <div className="rounded-3xl glass p-5 sm:p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">{t("wk.clientData")}</h2>

        {clients.length > 0 && (
          <div>
            <label className="text-sm text-slate-500">{t("role.client")}</label>
            <select
              value={clientId}
              onChange={(e) => selectClient(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              {t("wk.prefill")}
            </p>
          </div>
        )}

        <div>
          <label className="text-sm text-slate-500">{t("pf.sex")}</label>
          <div className="mt-1.5 flex gap-2">
            {SEXES.map((s) => (
              <button
                key={s.value}
                onClick={() => setSex(s.value)}
                className={`flex-1 rounded-2xl py-2.5 text-sm font-medium transition-colors ${
                  sex === s.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t(s.key)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col">
            <span className="text-sm text-slate-500 mb-1.5">{t("pf.age")}</span>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="30"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-slate-500 mb-1.5">{t("pf.weight")}</span>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-slate-500 mb-1.5">{t("pf.height")}</span>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="178"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-brand"
            />
          </label>
        </div>

        <div>
          <label className="text-sm text-slate-500">{t("wk.level")}</label>
          <div className="mt-1.5 flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={`flex-1 rounded-2xl py-2.5 text-sm font-medium transition-colors ${
                  level === l.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t(l.key)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-500">{t("wk.goalsNotes")}</label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={2}
            placeholder="Es. vuole aumentare la massa sulle gambe, ha problemi alla spalla destra..."
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand resize-none"
          />
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-brand">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {/* Azioni */}
      <div className="space-y-3">
        <button
          onClick={generate}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 font-semibold text-white shadow-cta transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> {t("wk.generating")}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" /> {t("wk.genAI")}
            </>
          )}
        </button>
        <button
          onClick={manual}
          disabled={loading || importing}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <PencilLine className="h-5 w-5" /> {t("wk.manual")}
        </button>

        {/* Importa una scheda già pronta (PDF, foto, CSV) → l'AI la ricostruisce nell'app */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.csv,.txt,image/jpeg,image/png,image/webp,image/gif"
          onChange={onFilePicked}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading || importing}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {importing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> {t("wk.importing")}
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" /> {t("wk.import")}
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-400">{t("wk.importHint")}</p>
      </div>
    </div>
  );
}
