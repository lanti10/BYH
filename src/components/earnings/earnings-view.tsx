"use client";

import { useState } from "react";
import {
  Zap, AlertTriangle, Lock, RefreshCw, Award, ChevronRight, UserCheck, Network,
  Wallet, ListChecks, Check, Flag,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import { formatPrice } from "@/lib/products";
import type { EarningsData } from "@/lib/earnings-demo";
import { CareerPathSheet } from "./career-path-sheet";
import { MovementsSheet } from "./movements-sheet";

export function EarningsView({ data }: { data: EarningsData }) {
  const { t, locale } = useT();
  const [career, setCareer] = useState(false);
  const [movements, setMovements] = useState(false);
  const eur = (n: number) => formatPrice(n, DATE_LOCALE[locale]);

  const a = data.activity;
  const b = data.balance;
  const c = data.career;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 lg:pb-8">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{t("earn.title")}</h1>
        {data.demo && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-medium text-amber-700">
            {t("earn.demoBadge")}
          </span>
        )}
      </div>

      {/* 0 · Stato attività (gate) */}
      {a.active ? (
        <div className="mb-4 rounded-3xl border border-slate-100 bg-white p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Zap className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-slate-900">{t("earn.active")}</p>
              <p className="text-[11px] text-slate-400">{t("earn.renewIn", { n: a.daysToRenew })}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
              {t("earn.activePill")}
            </span>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-900">{t("earn.generatedCycle")}</span>
              <span className="text-slate-400 tnum">{eur(a.generatedCycle)} / {eur(a.threshold)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (a.generatedCycle / a.threshold) * 100)}%` }} />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              {t("earn.activityHint", { amt: eur(a.threshold) })}
            </p>
          </div>
          <p className="mt-2.5 px-1 text-[10px] text-slate-400">{t("earn.thresholdNote")}</p>
        </div>
      ) : (
        <div className="mb-4 rounded-3xl border border-brand/30 bg-white p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-slate-900">{t("earn.inactive")}</p>
              <p className="text-[11px] text-brand">{t("earn.goingToByh")}</p>
            </div>
            <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-medium text-white">
              {t("earn.inactivePill")}
            </span>
          </div>
          <div className="mb-2.5 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            <Lock className="h-4 w-4 text-slate-400" />
            {t("earn.withdrawLocked")}
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-medium text-white shadow-cta">
            <RefreshCw className="h-4 w-4" />
            {t("earn.reactivate", { amt: eur(a.threshold) })}
          </button>
        </div>
      )}

      {/* 1 · Saldo */}
      <div className="mb-4 rounded-3xl bg-depth-dark p-5 text-white">
        <p className="text-xs text-white/60">{t("earn.monthEarnings")}</p>
        <p className="mb-3.5 mt-1 text-4xl font-semibold tracking-tight tnum">{eur(b.month)}</p>
        <div className="flex gap-2.5">
          <div className="flex-1 rounded-2xl bg-emerald-400/15 p-3">
            <p className="flex items-center gap-1 text-[11px] text-emerald-300"><Check className="h-3 w-3" />{t("earn.available")}</p>
            <p className="mt-0.5 text-lg font-medium tnum">{eur(b.available)}</p>
          </div>
          <div className="flex-1 rounded-2xl bg-amber-400/15 p-3">
            <p className="text-[11px] text-amber-300">{t("earn.pending")}</p>
            <p className="mt-0.5 text-lg font-medium tnum">{eur(b.pending)}</p>
          </div>
        </div>
      </div>

      {/* 2 · Carriera */}
      <button
        onClick={() => setCareer(true)}
        className="mb-4 w-full rounded-3xl border border-slate-100 bg-white p-4 text-left"
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
            <Award className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="text-[11px] text-slate-400">{t("earn.rankOf", { n: c.levelIndex })}</p>
            <p className="text-[17px] font-medium text-slate-900">
              {c.rankName}
              {c.stage != null && <span className="text-rose-700"> · Stage {c.stage}</span>}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300" />
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="mb-2 flex items-baseline justify-between text-xs">
            <span className="font-medium text-slate-900">{t("earn.depthUnlocked")}</span>
            <span className="text-slate-400">{t("earn.levelsCount", { a: c.depthUnlocked, b: c.depthTotal })}</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: c.depthTotal }).map((_, i) => (
              <span key={i} className="h-2.5 flex-1 overflow-hidden rounded-sm bg-slate-200">
                {i < c.depthUnlocked - 1 && <span className="block h-full w-full bg-brand" />}
                {i === c.depthUnlocked - 1 && <span className="block h-full w-2/3 bg-brand" />}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">{t("earn.depthHint", { n: c.depthUnlocked })}</p>
        </div>
      </button>

      {/* 3 · Andamento */}
      {data.trend.length > 0 && (
        <div className="mb-4 rounded-3xl border border-slate-100 bg-white p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-slate-900">{t("earn.trend")}</span>
            {b.vsPrevMonth !== 0 && (
              <span className="text-[11px] font-medium text-emerald-600">+{eur(b.vsPrevMonth)}</span>
            )}
          </div>
          <div className="flex h-20 items-end gap-2">
            {data.trend.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-md ${i === data.trend.length - 1 ? "bg-brand" : "bg-slate-200"}`}
                  style={{ height: `${Math.max(8, m.value * 56)}px` }}
                />
                <span className={`text-[9px] ${i === data.trend.length - 1 ? "font-medium text-slate-900" : "text-slate-400"}`}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 · Da dove arriva */}
      <div className="mb-4 rounded-3xl border border-slate-100 bg-white p-4">
        <p className="mb-3 text-[13px] font-medium text-slate-900">{t("earn.origin")}</p>

        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><UserCheck className="h-[18px] w-[18px]" /></span>
          <div className="flex-1">
            <p className="text-[13px] text-slate-900">{t("earn.direct")}</p>
            <p className="text-[11px] text-slate-400">{t("earn.directMeta", { p: data.origin.direct.products, c: data.origin.direct.clients })}</p>
          </div>
          <span className="text-[15px] font-medium text-slate-900 tnum">{eur(data.origin.direct.amount)}</span>
        </div>

        <div className="my-3 h-px bg-slate-100" />

        <div className="mb-2.5 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Network className="h-[18px] w-[18px]" /></span>
          <div className="flex-1">
            <p className="text-[13px] text-slate-900">{t("earn.network")}</p>
            <p className="text-[11px] text-slate-400">{t("earn.networkAggNote")}</p>
          </div>
          <span className="text-[15px] font-medium text-slate-900 tnum">{eur(data.origin.network.total)}</span>
        </div>

        <div className="space-y-1.5">
          {data.origin.network.levels.map((lv) => (
            <div
              key={lv.level}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${lv.unlocked ? "bg-indigo-50/60" : "bg-slate-50 opacity-60"}`}
            >
              <span className="flex items-center gap-1.5 text-slate-600">
                {!lv.unlocked && <Lock className="h-3 w-3 text-slate-400" />}
                {t("earn.level", { n: lv.level })} · {lv.pct}%
                {lv.unlocked && <span className="text-slate-400">· {t("earn.ptCount", { n: lv.count })}</span>}
              </span>
              <span className="font-medium text-slate-900 tnum">
                {lv.unlocked ? eur(lv.amount) : t("earn.locked")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5 · Prodotti più venduti */}
      {data.topProducts.length > 0 && (
        <div className="mb-4 rounded-3xl border border-slate-100 bg-white p-4">
          <p className="mb-3 text-[13px] font-medium text-slate-900">{t("earn.topProducts")}</p>
          <div className="space-y-2.5">
            {data.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-[13px]">
                <span className="min-w-0 truncate text-slate-900">
                  {p.name} <span className="text-slate-400">×{p.qty}</span>
                </span>
                <span className="ml-2 shrink-0 font-medium text-slate-900 tnum">{eur(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 · Prossimo pagamento */}
      <div className="mb-3 flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Wallet className="h-5 w-5" /></span>
        <div className="flex-1">
          <p className="text-[11px] text-slate-400">{t("earn.nextPayout")}</p>
          <p className="text-[14px] font-medium text-slate-900 tnum">
            {eur(data.payout.nextAmount)}
            {a.active
              ? ` · ${t("earn.payoutIn", { n: data.payout.nextAvailableInDays })}`
              : ` · ${t("earn.payoutLocked")}`}
          </p>
        </div>
      </div>

      <button
        onClick={() => setMovements(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-[13px] font-medium text-slate-900"
      >
        <ListChecks className="h-4 w-4" />
        {t("earn.movements")}
      </button>

      {data.demo && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-400">
          <Flag className="h-3 w-3" />
          {t("earn.demoFooter")}
        </p>
      )}

      {career && (
        <CareerPathSheet
          ladder={c.ladder}
          sharePct={c.networkSharePct}
          nextLabel={c.nextLabel}
          reqs={c.reqs}
          onClose={() => setCareer(false)}
        />
      )}
      {movements && <MovementsSheet movements={data.movements} onClose={() => setMovements(false)} />}
    </div>
  );
}
