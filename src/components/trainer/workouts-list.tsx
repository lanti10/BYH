"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dumbbell, CalendarDays, CalendarRange, ChevronRight, FileText, SlidersHorizontal, Check,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { PlanType } from "@/components/trainer/plan-type-picker";

export type PlanRow = {
  id: string;
  name: string;
  clientName: string | null;
  isTemplate: boolean;
  isActive: boolean;
  planType: PlanType;
  dayCount: number;
  totalExercises: number;
  durationWeeks: number | null;
};

type Status = "all" | "template" | "assigned";
type TypeFilter = "all" | PlanType;

export function WorkoutsList({ plans }: { plans: PlanRow[] }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("all");
  const [type, setType] = useState<TypeFilter>("all");

  const filtered = plans.filter((p) => {
    if (status === "template" && !p.isTemplate) return false;
    if (status === "assigned" && p.isTemplate) return false;
    if (type !== "all" && p.planType !== type) return false;
    return true;
  });

  const activeCount = (status !== "all" ? 1 : 0) + (type !== "all" ? 1 : 0);

  const statusOpts: { value: Status; label: string }[] = [
    { value: "all", label: t("wk.fAll") },
    { value: "template", label: t("wk.fTemplates") },
    { value: "assigned", label: t("wk.fAssigned") },
  ];
  const typeOpts: { value: TypeFilter; label: string }[] = [
    { value: "all", label: t("wk.fAll") },
    { value: "WEIGHTS", label: t("ptype.weights") },
    { value: "BODYWEIGHT", label: t("ptype.bodyweight") },
    { value: "SWIMMING", label: t("ptype.swimming") },
  ];

  return (
    <div>
      {/* Barra filtro */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            activeCount > 0
              ? "border-brand/20 bg-brand/10 text-brand"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("wk.filter")}
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-white tnum">
              {activeCount}
            </span>
          )}
        </button>
        <span className="text-sm text-slate-400 tnum">
          {t("wk.shown", { n: filtered.length, total: plans.length })}
        </span>
        {activeCount > 0 && (
          <button
            onClick={() => {
              setStatus("all");
              setType("all");
            }}
            className="ml-auto text-sm font-medium text-slate-400 hover:text-slate-600"
          >
            {t("wk.clearFilters")}
          </button>
        )}
      </div>

      {/* Pannello filtro */}
      {open && (
        <div className="mb-4 space-y-4 rounded-3xl glass p-5">
          <FilterGroup
            label={t("wk.fStatus")}
            options={statusOpts}
            value={status}
            onChange={(v) => setStatus(v as Status)}
          />
          <FilterGroup
            label={t("wk.fType")}
            options={typeOpts}
            value={type}
            onChange={(v) => setType(v as TypeFilter)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">{t("wk.noMatch")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((plan) => (
            <Link
              key={plan.id}
              href={`/trainer/workouts/${plan.id}`}
              className="group rounded-3xl glass p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{plan.name}</p>
                  <p className="truncate text-sm text-slate-500">
                    {plan.clientName ?? t("wk.templateNone")}
                  </p>
                </div>
                {plan.isTemplate ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    <FileText className="h-3 w-3" /> {t("wk.template")}
                  </span>
                ) : (
                  plan.isActive && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                      {t("wk.activeBadge")}
                    </span>
                  )
                )}
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> {t("wk.daysN", { n: plan.dayCount })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="h-4 w-4" /> {t("wk.exercisesN", { n: plan.totalExercises })}
                </span>
                {plan.durationWeeks && (
                  <span className="flex items-center gap-1.5">
                    <CalendarRange className="h-4 w-4" /> {t("wk.weeksShort", { n: plan.durationWeeks })}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {Array.from({ length: plan.dayCount }).map((_, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                  >
                    {t("plan.dayN", { n: i + 1 })}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-end text-sm font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                {t("wk.open")} <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-brand text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {active && <Check className="h-3.5 w-3.5" />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
