"use client";

import { useState } from "react";
import { ChevronRight, UserCheck, Network, CircleCheck, Clock, Ban, Info } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import { formatPrice } from "@/lib/products";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import type { Movement, MovementStatus } from "@/lib/earnings-demo";

function StatusChip({ status }: { status: MovementStatus }) {
  const { t } = useT();
  const map = {
    confirmed: { icon: CircleCheck, cls: "text-emerald-600", label: t("earn.confirmed") },
    pending: { icon: Clock, cls: "text-amber-600", label: t("earn.pending") },
    cancelled: { icon: Ban, cls: "text-slate-400", label: t("earn.cancelled") },
  }[status];
  const Icon = map.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] ${map.cls}`}>
      <Icon className="h-3 w-3" />
      {map.label}
    </span>
  );
}

export function MovementsSheet({ movements, onClose }: { movements: Movement[]; onClose: () => void }) {
  const { t, locale } = useT();
  const [selected, setSelected] = useState<Movement | null>(null);
  const eur = (n: number) => formatPrice(n, DATE_LOCALE[locale]);

  return (
    <BottomSheet onClose={onClose}>
      {!selected ? (
        <>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">{t("earn.movements")}</h2>
          {movements.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">{t("earn.emptyMovements")}</p>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => {
                const net = m.kind === "network";
                const Icon = net ? Network : UserCheck;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${net ? "bg-indigo-50 text-indigo-600" : "bg-brand/10 text-brand"}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-slate-900">{net ? t("earn.fromNetwork") : m.title}</p>
                      <p className="truncate text-[11px] text-slate-400">{m.subtitle} · {m.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-medium text-slate-900 tnum">{eur(m.amount)}</p>
                      <StatusChip status={m.status} />
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <button onClick={() => setSelected(null)} className="mb-3 text-sm font-medium text-brand">
            ‹ {t("earn.movements")}
          </button>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">{t("earn.movementDetail")}</p>
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            {selected.kind === "network" ? t("earn.fromNetwork") : selected.title}
          </h2>

          {selected.detail ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <Row label={t("earn.priceOnAmazon")} value={eur(selected.detail.price)} />
              <Row label={t("earn.amazonCommission")} value={eur(selected.detail.commission)} />
              <Row label={t("earn.lessCosts")} value={`− ${eur(selected.detail.costs)}`} />
              <Row label={t("earn.pvMargin")} value={eur(selected.detail.pv)} strong />
              <Row label={t("earn.yourCut")} value={`${selected.detail.pct}%`} muted />
              <EarningBox status={selected.status} amount={selected.amount} eur={eur} />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="mb-3 text-sm text-slate-500">{selected.subtitle} · {selected.date}</p>
              <EarningBox status={selected.status} amount={selected.amount} eur={eur} />
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t("earn.networkMovementNote")}
              </p>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
}

// Il guadagno finale cambia in base allo stato: annullato → €0 stornato,
// in attesa → mostrato ma non ancora confermato, confermato → guadagno pieno.
function EarningBox({ status, amount, eur }: { status: MovementStatus; amount: number; eur: (n: number) => string }) {
  const { t } = useT();
  if (status === "cancelled") {
    return (
      <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900">{t("earn.yourEarning")}</span>
          <span className="tnum">
            <s className="mr-1.5 text-slate-300">{eur(amount)}</s>
            <span className="text-xl font-semibold text-slate-400">{eur(0)}</span>
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-rose-500">{t("earn.cancelledNote")}</p>
      </div>
    );
  }
  const pending = status === "pending";
  return (
    <div className={`mt-2 rounded-2xl px-4 py-3 ${pending ? "bg-amber-500/10" : "bg-brand/[0.06]"}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-900">{t("earn.yourEarning")}</span>
        <span className={`text-xl font-semibold tnum ${pending ? "text-amber-600" : "text-brand"}`}>{eur(amount)}</span>
      </div>
      {pending && <p className="mt-1.5 text-[11px] leading-relaxed text-amber-600">{t("earn.pendingNote")}</p>}
    </div>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-2.5 last:border-0">
      <span className={`text-[13px] ${strong ? "font-medium text-slate-900" : muted ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
      <span className={`text-[13px] tnum ${strong ? "font-medium text-slate-900" : muted ? "text-slate-400" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}
