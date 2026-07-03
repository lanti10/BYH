import { Check } from "lucide-react";

// Striscia degli ultimi 7 giorni stile Apple Fitness: cerchio pieno = allenamento fatto
export function WeekStrip({
  days,
}: {
  days: { label: string; done: boolean; isToday: boolean }[];
}) {
  return (
    <div className="flex justify-between">
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <span
            className={`text-[11px] font-medium uppercase tracking-wide ${
              d.isToday ? "text-brand font-semibold" : "text-slate-400"
            }`}
          >
            {d.label}
          </span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              d.done
                ? "bg-brand text-white shadow-cta"
                : d.isToday
                  ? "border-2 border-brand/40"
                  : "border-2 border-slate-200"
            }`}
          >
            {d.done && <Check className="h-4 w-4" strokeWidth={3} />}
          </div>
        </div>
      ))}
    </div>
  );
}
