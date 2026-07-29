"use client";

// Area dell'admin non ancora sviluppata. A differenza di un "coming soon" generico,
// dichiara cosa conterrà: lo scheletro serve proprio a vedere la struttura completa
// e a decidere insieme da dove partire.

import { Check } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function AreaStub({
  title,
  intro,
  points,
}: {
  title: string;
  intro: string;
  /** Cosa conterrà l'area, in ordine di utilità. Chiavi del dizionario. */
  points: string[];
}) {
  const { t } = useT();
  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-[28px] font-bold tracking-tight text-slate-900">{t(title)}</h1>
      <p className="mt-1 text-slate-500">{t(intro)}</p>

      <div className="mt-6 rounded-3xl glass p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400">
          {t("adm.willContain")}
        </p>
        <ul className="mt-4 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200">
                <Check className="h-3 w-3 text-slate-500" strokeWidth={3} />
              </span>
              <span className="text-sm text-slate-700">{t(p)}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 px-1 text-xs text-slate-400">{t("adm.stubNote")}</p>
    </div>
  );
}
