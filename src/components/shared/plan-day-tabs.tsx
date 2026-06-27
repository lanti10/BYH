"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";

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

export function PlanDayTabs({ days }: { days: PlanDay[] }) {
  const [active, setActive] = useState(0);

  if (days.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">Nessun giorno in questa scheda.</p>;
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
            className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              i === active
                ? "bg-[#D42B27] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Giorno {i + 1}
          </button>
        ))}
      </div>

      {/* Nome giorno */}
      {day.name && (
        <p className="mt-4 text-lg font-bold text-slate-900">{day.name}</p>
      )}

      {/* Esercizi del giorno selezionato */}
      <div className="mt-3 space-y-2">
        {day.exercises.map((ex, i) => (
          <div key={ex.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D42B27]/10 text-sm font-bold text-[#D42B27]">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{ex.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {ex.sets} × {ex.reps}
                </span>
                {ex.weight != null && (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {ex.weight} kg
                  </span>
                )}
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {ex.restSeconds}s rec.
                </span>
              </div>
            </div>
          </div>
        ))}
        {day.exercises.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center text-slate-400">
            <Dumbbell className="h-6 w-6 mb-2" />
            <p className="text-sm">Nessun esercizio in questo giorno.</p>
          </div>
        )}
      </div>
    </div>
  );
}
