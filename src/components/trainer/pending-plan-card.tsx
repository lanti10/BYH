"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, Check, X, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { approveClientPlan, rejectClientPlan } from "@/app/(dashboard)/trainer/workouts/actions";

// Scheda creata dal cliente e in attesa: il trainer la vede qui e decide.
// Finché non approva, la scheda che ha assegnato lui resta quella attiva.
export function PendingPlanCard({
  planId,
  planName,
  daysCount,
  exercisesCount,
}: {
  planId: string;
  planName: string;
  daysCount: number;
  exercisesCount: number;
}) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState(false);

  async function run(kind: "approve" | "reject") {
    if (busy) return;
    setBusy(kind);
    try {
      const res = kind === "approve" ? await approveClientPlan(planId) : await rejectClientPlan(planId);
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  if (done) return null;

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <ClipboardCheck className="h-5 w-5 text-amber-700" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">{t("appr.title")}</p>
          <p className="mt-0.5 text-xs text-amber-700">{t("appr.sub")}</p>
        </div>
      </div>

      <Link
        href={`/trainer/workouts/${planId}`}
        className="mb-3 flex items-center justify-between rounded-2xl bg-white px-3.5 py-3"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{planName}</p>
          <p className="mt-0.5 text-xs text-slate-400 tnum">
            {t("wk.daysN", { n: daysCount })} · {t("wk.exercisesN", { n: exercisesCount })}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </Link>

      <div className="flex gap-2">
        <button
          onClick={() => run("approve")}
          disabled={!!busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand py-2.5 text-sm font-medium text-white shadow-cta disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {busy === "approve" ? t("session.saving") : t("appr.approve")}
        </button>
        <button
          onClick={() => run("reject")}
          disabled={!!busy}
          className="flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          {t("appr.reject")}
        </button>
      </div>
    </div>
  );
}
