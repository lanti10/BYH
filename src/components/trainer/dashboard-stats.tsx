"use client";

import { useState } from "react";
import Link from "next/link";
import { UserMinus, ShoppingBag, ClipboardList, TrendingUp, X, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export type MiniClient = {
  id: string;
  name: string;
  avatarUrl: string | null;
  subtitle: string; // es. "Ultimo allenamento 12 giorni fa" / "Nessuna scheda"
};

// Le 4 tessere della dashboard trainer.
// Quelle sui clienti aprono l'elenco delle persone da sistemare, direttamente
// qui: ogni riga porta alla pagina di quel cliente.
export function DashboardStats({
  idle,
  noPlan,
  pickedProducts,
  earnings,
}: {
  idle: MiniClient[];
  noPlan: MiniClient[];
  pickedProducts: number;
  earnings: string;
}) {
  const { t } = useT();
  const [sheet, setSheet] = useState<"idle" | "noPlan" | null>(null);

  const list = sheet === "idle" ? idle : sheet === "noPlan" ? noPlan : [];
  const sheetTitle = sheet === "idle" ? t("tr.idleClients") : t("tr.noPlan");

  const tileClass = "rounded-2xl glass p-4 sm:p-5 text-left transition-transform active:scale-[0.98]";

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button onClick={() => idle.length > 0 && setSheet("idle")} className={tileClass}>
          <Tile
            icon={<UserMinus className="h-5 w-5" />}
            tint="bg-amber-500/10 text-amber-600"
            value={idle.length}
            label={t("tr.idleClients")}
          />
        </button>

        <Link href="/trainer/products" className={tileClass}>
          <Tile
            icon={<ShoppingBag className="h-5 w-5" />}
            tint="bg-emerald-500/10 text-emerald-600"
            value={pickedProducts}
            label={t("tr.pickedProducts")}
          />
        </Link>

        <button onClick={() => noPlan.length > 0 && setSheet("noPlan")} className={tileClass}>
          <Tile
            icon={<ClipboardList className="h-5 w-5" />}
            tint="bg-blue-500/10 text-blue-600"
            value={noPlan.length}
            label={t("tr.noPlan")}
          />
        </button>

        <Link href="/trainer/earnings" className={tileClass}>
          <Tile
            icon={<TrendingUp className="h-5 w-5" />}
            tint="bg-brand/10 text-brand"
            value={earnings}
            label={t("tr.earnings")}
          />
        </Link>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheet(null)} />
          <div className="relative w-full max-w-md max-h-[80dvh] overflow-y-auto rounded-t-3xl glass-prominent p-4 pb-8">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                {sheetTitle} · {list.length}
              </h2>
              <button
                onClick={() => setSheet(null)}
                aria-label={t("common.close")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {list.map((c) => (
                <Link
                  key={c.id}
                  href={`/trainer/clients/${c.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                    {c.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (c.name || "?").slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{c.name}</span>
                    <span className="block truncate text-xs text-slate-400">{c.subtitle}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Tile({
  icon,
  tint,
  value,
  label,
}: {
  icon: React.ReactNode;
  tint: string;
  value: number | string;
  label: string;
}) {
  return (
    <>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint} mb-3`}>{icon}</div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5">{label}</p>
    </>
  );
}
