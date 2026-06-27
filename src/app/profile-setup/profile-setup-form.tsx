"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { completeClientProfile } from "./actions";
import { Loader2, AlertCircle, Check } from "lucide-react";

const SEXES = ["Uomo", "Donna"];
const GOALS = [
  "Dimagrimento",
  "Massa muscolare",
  "Forza",
  "Tonificazione",
  "Resistenza",
  "Salute generale",
];

export function ProfileSetupForm({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [days, setDays] = useState(3);
  const [goals, setGoals] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGoal(g: string) {
    setGoals((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));
  }

  async function submit() {
    setError(null);
    if (!sex) return setError("Seleziona il sesso.");
    if (!height || !weight) return setError("Inserisci altezza e peso.");
    if (goals.length === 0) return setError("Scegli almeno un obiettivo.");

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
    if (res.ok) {
      router.push("/client");
      router.refresh();
    } else {
      setSaving(false);
      setError(res.error ?? "Errore. Riprova.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#D42B27] to-[#a81f1c] px-4 pt-10 pb-16 text-center text-white">
        <div className="relative mx-auto h-16 w-16 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
          <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
        </div>
        <h1 className="mt-4 text-2xl font-black">Ciao {firstName}!</h1>
        <p className="mt-1 text-white/80 text-sm max-w-sm mx-auto">
          Completa il tuo profilo: servirà al tuo trainer per crearti una scheda su misura.
        </p>
      </div>

      <div className="mx-auto -mt-10 max-w-lg px-4 pb-12 space-y-4">
        {/* Sesso */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="font-semibold text-slate-800 mb-3">Sesso</p>
          <div className="flex gap-2">
            {SEXES.map((s) => (
              <button
                key={s}
                onClick={() => setSex(s)}
                className={`flex-1 rounded-2xl py-3 font-medium transition-colors ${
                  sex === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Dati fisici */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="font-semibold text-slate-800 mb-3">I tuoi dati</p>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1.5">Età</span>
              <input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="30"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-[#D42B27]"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1.5">Altezza (cm)</span>
              <input
                type="number"
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="178"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-[#D42B27]"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1.5">Peso (kg)</span>
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-[#D42B27]"
              />
            </label>
          </div>
        </div>

        {/* Giorni allenamento */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="font-semibold text-slate-800 mb-1">Quanti giorni a settimana puoi allenarti?</p>
          <p className="text-xs text-slate-400 mb-3">Aiuta il trainer a impostare la frequenza giusta.</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => setDays(n)}
                className={`h-12 w-12 rounded-2xl text-base font-bold transition-colors ${
                  days === n ? "bg-[#D42B27] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Obiettivi */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="font-semibold text-slate-800 mb-1">Obiettivi</p>
          <p className="text-xs text-slate-400 mb-3">Puoi sceglierne più di uno.</p>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => toggleGoal(g)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  goals.includes(g)
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {goals.includes(g) && <Check className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />}
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="font-semibold text-slate-800 mb-1">Note per il trainer (facoltativo)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Es. infortuni, preferenze, esperienza pregressa, attrezzatura disponibile..."
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[#D42B27] resize-none"
          />
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-[#D42B27]">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-semibold text-white shadow-lg transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {saving ? "Salvataggio..." : "Completa profilo"}
        </button>
      </div>
    </div>
  );
}
