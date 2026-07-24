"use client";

import { useState } from "react";
import { UserCheck, Network, Package, ShoppingCart } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import { formatPrice } from "@/lib/products";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import type { EarningsData } from "@/lib/earnings-demo";

type Month = EarningsData["trend"][number];

export function MonthStatsSheet({ months, onClose }: { months: Month[]; onClose: () => void }) {
  const { t, locale } = useT();
  const [sel, setSel] = useState(months.length - 1); // default: mese corrente
  const m = months[sel];
  const eur = (n: number) => formatPrice(n, DATE_LOCALE[locale]);

  return (
    <BottomSheet onClose={onClose}>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{t("earn.monthStats")}</h2>

      {/* Selettore mese */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {months.map((mm, i) => (
          <button
            key={mm.label}
            onClick={() => setSel(i)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
              i === sel ? "bg-brand text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {mm.label}
            {i === months.length - 1 ? ` · ${t("earn.thisMonth")}` : ""}
          </button>
        ))}
      </div>

      {/* Totale del mese */}
      <div className="mb-3 rounded-3xl bg-depth-dark p-5 text-white">
        <p className="text-xs text-white/60">{t("earn.monthEarnings")}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tnum">{eur(m.total)}</p>
      </div>

      {/* Dettaglio */}
      <div className="grid grid-cols-2 gap-2.5">
        <Stat icon={<UserCheck className="h-4 w-4" />} tint="bg-brand/10 text-brand" label={t("earn.mDirect")} value={eur(m.direct)} />
        <Stat icon={<Network className="h-4 w-4" />} tint="bg-indigo-50 text-indigo-600" label={t("earn.mNetwork")} value={eur(m.network)} />
        <Stat icon={<Package className="h-4 w-4" />} tint="bg-emerald-50 text-emerald-600" label={t("earn.mProducts")} value={String(m.products)} />
        <Stat icon={<ShoppingCart className="h-4 w-4" />} tint="bg-amber-50 text-amber-600" label={t("earn.mSales")} value={String(m.sales)} />
      </div>
    </BottomSheet>
  );
}

function Stat({ icon, tint, label, value }: { icon: React.ReactNode; tint: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3.5">
      <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
      <p className="text-lg font-semibold text-slate-900 tnum">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}
