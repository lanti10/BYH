"use client";

import { Dumbbell, PersonStanding, Waves } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// I tre tipi di scheda: con pesi, corpo libero, nuoto.
// Il valore è canonico (enum Prisma PlanType); la label è tradotta.
export type PlanType = "WEIGHTS" | "BODYWEIGHT" | "SWIMMING";

export const PLAN_TYPES: { value: PlanType; key: string; Icon: typeof Dumbbell }[] = [
  { value: "WEIGHTS", key: "ptype.weights", Icon: Dumbbell },
  { value: "BODYWEIGHT", key: "ptype.bodyweight", Icon: PersonStanding },
  { value: "SWIMMING", key: "ptype.swimming", Icon: Waves },
];

// true = questo tipo di scheda usa un carico in kg (mostra il campo peso)
export function typeUsesWeight(t: PlanType) {
  return t === "WEIGHTS";
}

export function PlanTypePicker({
  value,
  onChange,
}: {
  value: PlanType;
  onChange: (v: PlanType) => void;
}) {
  const { t } = useT();
  return (
    <div className="grid grid-cols-3 gap-2">
      {PLAN_TYPES.map(({ value: v, key, Icon }) => {
        const selected = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex flex-col items-center gap-2 rounded-2xl py-4 text-sm font-semibold transition-colors ${
              selected
                ? "bg-brand text-white shadow-cta"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Icon className="h-6 w-6" />
            {t(key)}
          </button>
        );
      })}
    </div>
  );
}
