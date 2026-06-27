"use client";

import { useState } from "react";
import { WorkoutBuilder } from "./workout-builder";
import type { DayInput } from "../actions";
import { Sparkles, PencilLine, AlertCircle, Loader2 } from "lucide-react";

export type ClientOption = {
  id: string;
  name: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  goals?: string | null;
};

const TRAINING_TYPES = [
  "Ipertrofia / Massa",
  "Forza",
  "Dimagrimento",
  "Resistenza",
  "Tonificazione",
  "Functional / Full body",
];
const LEVELS = ["Principiante", "Intermedio", "Avanzato"];
const SEXES = ["Uomo", "Donna"];

export function WorkoutCreator({
  clients,
  initialClientId,
}: {
  clients: ClientOption[];
  initialClientId?: string;
}) {
  const [phase, setPhase] = useState<"config" | "edit">("config");

  const [clientId, setClientId] = useState(
    initialClientId && clients.some((c) => c.id === initialClientId)
      ? initialClientId
      : clients[0]?.id ?? ""
  );
  const [trainingType, setTrainingType] = useState(TRAINING_TYPES[0]);
  const [frequency, setFrequency] = useState(3);
  const [sex, setSex] = useState("");
  const [age, setAge] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [level, setLevel] = useState(LEVELS[1]);
  const [goals, setGoals] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDays, setGeneratedDays] = useState<DayInput[] | undefined>(undefined);

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

  const suggestedName = `${trainingType} · ${frequency}x sett.`;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workouts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        setError(data.error ?? "Errore nella generazione.");
        return;
      }
      setGeneratedDays(data.days as DayInput[]);
      setPhase("edit");
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  function manual() {
    setGeneratedDays(undefined);
    setPhase("edit");
  }

  if (phase === "edit") {
    return (
      <WorkoutBuilder
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        initialClientId={clientId}
        initialName={suggestedName}
        initialDays={generatedDays}
        onBack={() => setPhase("config")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tipo di allenamento */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Tipo di allenamento</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRAINING_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTrainingType(t)}
              className={`rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                trainingType === t
                  ? "bg-[#D42B27] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Frequenza */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Quante volte a settimana</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setFrequency(n)}
              className={`h-12 w-12 rounded-2xl text-base font-bold transition-colors ${
                frequency === n
                  ? "bg-[#D42B27] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Dati fisici */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Dati fisici del cliente</h2>

        {clients.length > 0 && (
          <div>
            <label className="text-sm text-slate-500">Cliente</label>
            <select
              value={clientId}
              onChange={(e) => selectClient(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#D42B27] focus:ring-2 focus:ring-[#D42B27]/20"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Seleziona un cliente per precompilare i dati (puoi modificarli).
            </p>
          </div>
        )}

        <div>
          <label className="text-sm text-slate-500">Sesso</label>
          <div className="mt-1.5 flex gap-2">
            {SEXES.map((s) => (
              <button
                key={s}
                onClick={() => setSex(s)}
                className={`flex-1 rounded-2xl py-2.5 text-sm font-medium transition-colors ${
                  sex === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col">
            <span className="text-sm text-slate-500 mb-1.5">Età</span>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="30"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-[#D42B27]"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-slate-500 mb-1.5">Peso (kg)</span>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-[#D42B27]"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-slate-500 mb-1.5">Altezza (cm)</span>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="178"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-[#D42B27]"
            />
          </label>
        </div>

        <div>
          <label className="text-sm text-slate-500">Livello</label>
          <div className="mt-1.5 flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`flex-1 rounded-2xl py-2.5 text-sm font-medium transition-colors ${
                  level === l ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-500">Obiettivi e note (facoltativo)</label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={2}
            placeholder="Es. vuole aumentare la massa sulle gambe, ha problemi alla spalla destra..."
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#D42B27] resize-none"
          />
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-[#D42B27]">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {/* Azioni */}
      <div className="space-y-3">
        <button
          onClick={generate}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D42B27] to-[#a81f1c] py-4 font-semibold text-white shadow-lg transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Generazione in corso...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" /> Genera scheda con l&apos;AI
            </>
          )}
        </button>
        <button
          onClick={manual}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <PencilLine className="h-5 w-5" /> Crea manualmente
        </button>
      </div>
    </div>
  );
}
