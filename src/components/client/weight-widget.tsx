"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, X, Info, Check, AlertCircle, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { logWeight } from "@/app/(dashboard)/client/actions";

export function WeightWidget({ currentWeight }: { currentWeight: number | null }) {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentWeight != null ? String(currentWeight) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const kg = Number(value.replace(",", "."));
    if (!Number.isFinite(kg) || kg <= 0 || kg > 500) {
      setError(t("weight.invalid"));
      return;
    }
    setSaving(true);
    setError(null);
    const res = await logWeight(kg);
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error ?? t("weight.invalid"));
    }
  }

  return (
    <>
      {/* Tessera: stessa grafica di prima, ora apre il dialog */}
      <button
        onClick={() => {
          setValue(currentWeight != null ? String(currentWeight) : "");
          setError(null);
          setOpen(true);
        }}
        className="rounded-3xl glass p-4 text-left transition-shadow hover:shadow-md"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 mb-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-2xl font-bold text-slate-900 leading-none tnum">
          {currentWeight ?? "—"}
          <span className="text-sm font-medium text-slate-400"> kg</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">{t("dash.currentWeight")}</p>
      </button>

      {/* Dialog inserimento peso */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl glass-prominent p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">{t("weight.update")}</h3>
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
                aria-label={t("common.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Avviso: aggiornare una volta a settimana */}
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-brand/5 p-3.5 text-sm text-slate-600">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-brand" />
              <p>{t("weight.advice")}</p>
            </div>

            <label className="block">
              <span className="text-sm text-slate-500">{t("weight.label")}</span>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                max={500}
                step={0.1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="75"
                autoFocus
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            {error && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-brand">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}

            <button
              onClick={save}
              disabled={saving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-semibold text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Check className="h-5 w-5" /> {t("weight.save")}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
