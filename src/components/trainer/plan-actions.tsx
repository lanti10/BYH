"use client";

import { useT } from "@/lib/i18n/client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteWorkoutPlan } from "@/app/(dashboard)/trainer/workouts/actions";
import { Pencil, Trash2, Loader2 } from "lucide-react";

export function PlanActions({ planId }: { planId: string }) {
  const router = useRouter();
  const { t } = useT();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    const res = await deleteWorkoutPlan(planId);
    if (res.ok) {
      router.push("/trainer/workouts");
      router.refresh();
    } else {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 hidden sm:block">{t("pd.confirmDel")}</span>
        <button
          onClick={remove}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {t("pd.yesDel")}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded-full px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          {t("common.cancel")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/trainer/workouts/${planId}/edit`}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Pencil className="h-4 w-4" /> {t("pd.edit")}
      </Link>
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-100"
      >
        <Trash2 className="h-4 w-4" /> {t("pd.delete")}
      </button>
    </div>
  );
}
