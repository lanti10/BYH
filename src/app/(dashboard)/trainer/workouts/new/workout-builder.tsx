"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutPlan, type DayInput } from "../actions";
import { Plus, Trash2, Dumbbell, GripVertical, AlertCircle, ArrowLeft } from "lucide-react";

type ClientOption = { id: string; name: string };

let uid = 0;
const newId = () => `tmp-${uid++}`;

type ExRow = { id: string; name: string; sets: number; reps: string; weight: string; restSeconds: number };
type DayCard = { id: string; name: string; exercises: ExRow[] };

function emptyExercise(): ExRow {
  return { id: newId(), name: "", sets: 3, reps: "10", weight: "", restSeconds: 60 };
}
function emptyDay(): DayCard {
  return { id: newId(), name: "", exercises: [emptyExercise()] };
}

// Converte i giorni "semplici" (es. generati dall'AI) in DayCard con id
function toDayCards(days?: DayInput[]): DayCard[] {
  if (!days || days.length === 0) return [emptyDay()];
  return days.map((d) => ({
    id: newId(),
    name: d.name,
    exercises:
      d.exercises.length > 0
        ? d.exercises.map((e) => ({
            id: newId(),
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight != null ? String(e.weight) : "",
            restSeconds: e.restSeconds,
          }))
        : [emptyExercise()],
  }));
}

export function WorkoutBuilder({
  clients,
  initialClientId,
  initialName = "",
  initialDays,
  onBack,
}: {
  clients: ClientOption[];
  initialClientId?: string;
  initialName?: string;
  initialDays?: DayInput[];
  onBack?: () => void;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(initialClientId ?? clients[0]?.id ?? "");
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<DayCard[]>(toDayCards(initialDays));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setDays((ds) => [...ds, emptyDay()]);
  }
  function removeDay(id: string) {
    setDays((ds) => ds.filter((d) => d.id !== id));
  }

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Dai un nome alla scheda.");

    setSaving(true);
    const payload = {
      clientId: clientId || null,
      name,
      description,
      days: days.map((d) => ({
        name: d.name,
        exercises: d.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight.trim() === "" ? null : Number(e.weight),
          restSeconds: e.restSeconds,
        })),
      })),
    };
    const res = await createWorkoutPlan(payload);
    setSaving(false);
    if (res.ok) {
      router.push("/trainer/workouts");
    } else {
      setError(res.error ?? "Errore nel salvataggio.");
    }
  }

  return (
    <div className="space-y-6 pb-28">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" /> Modifica impostazioni
        </button>
      )}

      {/* Dati scheda */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">Assegna a</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#D42B27] focus:ring-2 focus:ring-[#D42B27]/20"
          >
            <option value="">Nessun cliente — salva come modello</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Salva senza cliente per tenere la scheda come modello da riutilizzare.
          </p>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Nome scheda</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Massa - Fase 1"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#D42B27] focus:ring-2 focus:ring-[#D42B27]/20"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Descrizione (facoltativa)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Note generali sulla scheda..."
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[#D42B27] focus:ring-2 focus:ring-[#D42B27]/20 resize-none"
          />
        </div>
      </div>

      {/* Giorni */}
      {days.map((day, di) => (
        <div key={day.id} className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 min-w-9 px-2 items-center justify-center rounded-xl bg-[#D42B27] text-sm font-black text-white shrink-0">
              {di + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400">Giorno {di + 1}</p>
              <input
                value={day.name}
                onChange={(e) => updateDay(day.id, { name: e.target.value })}
                placeholder="Nome (es. Petto e tricipiti)"
                className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none placeholder:text-slate-300"
              />
            </div>
            {days.length > 1 && (
              <button
                onClick={() => removeDay(day.id)}
                className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                aria-label="Rimuovi giorno"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Esercizi */}
          <div className="space-y-2">
            {day.exercises.map((ex) => (
              <div key={ex.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                  <input
                    value={ex.name}
                    onChange={(e) => updateExercise(day.id, ex.id, { name: e.target.value })}
                    placeholder="Nome esercizio (es. Panca piana)"
                    className="flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => removeExercise(day.id, ex.id)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:text-red-500"
                    aria-label="Rimuovi esercizio"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pl-6">
                  <label className="flex flex-col">
                    <span className="text-[11px] text-slate-400 mb-1">Serie</span>
                    <input
                      type="number"
                      min={1}
                      value={ex.sets}
                      onChange={(e) => updateExercise(day.id, ex.id, { sets: +e.target.value })}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#D42B27]"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-[11px] text-slate-400 mb-1">Ripetizioni</span>
                    <input
                      value={ex.reps}
                      onChange={(e) => updateExercise(day.id, ex.id, { reps: e.target.value })}
                      placeholder="8-12"
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#D42B27]"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-[11px] text-slate-400 mb-1">Peso (kg)</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={ex.weight}
                      onChange={(e) => updateExercise(day.id, ex.id, { weight: e.target.value })}
                      placeholder="—"
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#D42B27]"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-[11px] text-slate-400 mb-1">Rec. (s)</span>
                    <input
                      type="number"
                      min={0}
                      step={15}
                      value={ex.restSeconds}
                      onChange={(e) => updateExercise(day.id, ex.id, { restSeconds: +e.target.value })}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#D42B27]"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addExercise(day.id)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-2.5 text-sm font-medium text-slate-400 hover:border-[#D42B27]/40 hover:text-[#D42B27]"
          >
            <Plus className="h-4 w-4" /> Aggiungi esercizio
          </button>
        </div>
      ))}

      <button
        onClick={addDay}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 py-4 font-semibold text-slate-500 hover:border-slate-400 hover:text-slate-700"
      >
        <Plus className="h-5 w-5" /> Aggiungi giorno
      </button>

      {/* Barra salvataggio fissa */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 border-t border-slate-100 bg-white/90 backdrop-blur p-4 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-[#D42B27] flex-1">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="ml-auto rounded-2xl bg-emerald-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Salva scheda"}
          </button>
        </div>
      </div>
    </div>
  );
}
