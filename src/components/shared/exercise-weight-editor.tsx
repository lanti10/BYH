"use client";

import { useState } from "react";
import { Check, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";

// Peso che l'utente usa davvero su un esercizio: casella modificabile + andamento.
// Sta qui (e non nella vista scheda) perché serve in due posti con due sfondi diversi:
// nella scheda (chiaro) e DURANTE l'allenamento (scuro), che è il vero momento del bisogno.
// La prescrizione del trainer non viene mai sovrascritta: ogni salvataggio è una riga di storico.

export type WeightEntry = { weight: number; date: string };
type Tone = "light" | "dark";

const TONE: Record<Tone, Record<string, string>> = {
  light: {
    card: "bg-slate-50",
    label: "text-slate-700",
    input: "border-slate-200 bg-white text-slate-900",
    unit: "text-slate-400",
    muted: "text-slate-400",
    subtle: "text-slate-500",
    divider: "border-black/5",
    current: "text-slate-900",
    old: "text-slate-400",
  },
  dark: {
    card: "bg-white/8",
    label: "text-white/80",
    input: "border-white/15 bg-white/10 text-white placeholder:text-white/30",
    unit: "text-white/40",
    muted: "text-white/50",
    subtle: "text-white/60",
    divider: "border-white/10",
    current: "text-white",
    old: "text-white/40",
  },
};

export function ExerciseWeightEditor({
  exerciseId,
  coachWeight,
  history,
  onSaved,
  tone = "light",
}: {
  exerciseId: string;
  coachWeight: number | null; // prescrizione del trainer, mostrata come riferimento
  history: WeightEntry[];
  onSaved: (entry: WeightEntry) => void;
  tone?: Tone;
}) {
  const { t } = useT();
  const c = TONE[tone];
  const current = history[0]?.weight ?? coachWeight;
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
        body: JSON.stringify({ workoutExerciseId: exerciseId, weight: w }),
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

  return (
    <div className={`mt-2.5 rounded-2xl p-4 ${c.card}`}>
      <label className="block">
        <span className={`text-sm font-semibold ${c.label}`}>{t("plan.myWeight")}</span>
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
              className={`w-full rounded-2xl border px-4 py-3 pr-12 text-base font-bold tnum outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${c.input}`}
            />
            <span
              className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold ${c.unit}`}
            >
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

      {coachWeight != null && (
        <p className={`mt-2.5 text-xs tnum ${c.muted}`}>{t("plan.coachWeight", { w: coachWeight })}</p>
      )}

      {history.length > 0 && (
        <WeightHistoryList
          history={history}
          tone={tone}
          className={`mt-3 border-t pt-3 ${c.divider}`}
        />
      )}
    </div>
  );
}

// Sola lettura: la usa il trainer per seguire l'andamento del cliente.
export function WeightReadout({ history, tone = "light" }: { history: WeightEntry[]; tone?: Tone }) {
  const { t } = useT();
  const c = TONE[tone];
  return (
    <div className={`mt-2.5 rounded-2xl p-4 ${c.card}`}>
      <p className={`text-xs ${c.muted}`}>{t("plan.clientWeight")}</p>
      <p className={`text-lg font-bold tnum ${c.current}`}>{history[0].weight} kg</p>
      <WeightHistoryList history={history} tone={tone} className={`mt-3 border-t pt-3 ${c.divider}`} />
    </div>
  );
}

// Andamento del carico: variazione rispetto all'aggiornamento precedente + ultime righe
function WeightHistoryList({
  history,
  tone = "light",
  className = "",
}: {
  history: WeightEntry[];
  tone?: Tone;
  className?: string;
}) {
  const { t, locale } = useT();
  const c = TONE[tone];
  const dl = DATE_LOCALE[locale];
  const prev = history[1]?.weight ?? null;
  const delta = prev != null ? history[0].weight - prev : null;

  return (
    <div className={className}>
      <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${c.subtle}`}>
        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> {t("plan.weightHistory")}
        {delta != null && delta !== 0 && (
          <span className={delta > 0 ? "text-emerald-500 tnum" : `${c.muted} tnum`}>
            {delta > 0 ? "+" : ""}
            {Math.round(delta * 100) / 100} kg
          </span>
        )}
      </div>
      <div className="space-y-1">
        {history.slice(0, 5).map((h, i) => (
          <div key={i} className="flex items-center justify-between text-xs tnum">
            <span className={c.muted}>
              {new Date(h.date).toLocaleDateString(dl, { day: "numeric", month: "short" })}
            </span>
            <span className={`font-semibold ${i === 0 ? c.current : c.old}`}>{h.weight} kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}
