"use client";

import { CircleCheck, Award, Lock } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import type { LadderRank } from "@/lib/earnings-demo";

// Colori identità per rango (tinte iOS soft), coerenti col design BYH Pulse
const RANK_TINT: Record<string, string> = {
  Trainer: "bg-emerald-50 text-emerald-700",
  Coach: "bg-sky-50 text-sky-700",
  "Head Coach": "bg-lime-50 text-lime-700",
  "Master Trainer": "bg-amber-50 text-amber-700",
  Mentor: "bg-rose-50 text-rose-700",
  Ambassador: "bg-slate-100 text-slate-600",
  "Master Coach": "bg-indigo-50 text-indigo-700",
};

export function CareerPathSheet({
  ladder,
  sharePct,
  nextLabel,
  reqs,
  onClose,
}: {
  ladder: LadderRank[];
  sharePct: number;
  nextLabel: string;
  reqs: { rank: string | null; have: number; need: number }[];
  onClose: () => void;
}) {
  const { t } = useT();

  return (
    <BottomSheet onClose={onClose}>
      <h2 className="text-lg font-semibold text-slate-900">{t("earn.careerPath")}</h2>
      <p className="mb-4 mt-0.5 text-xs leading-relaxed text-slate-500">{t("earn.careerIntro")}</p>

      {/* Prossimo traguardo */}
      <p className="mb-2 px-1 text-[11px] uppercase tracking-wide text-slate-400">
        {t("earn.nextMilestone", { name: nextLabel })}
      </p>
      <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-3.5">
        {reqs.map((r, i) => {
          const done = r.have >= r.need;
          const pct = Math.min(100, (r.have / r.need) * 100);
          const label = r.rank ? t("earn.reqInNetwork", { rank: r.rank }) : t("earn.netActive");
          return (
            <div key={i} className={i < reqs.length - 1 ? "mb-3" : ""}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-900">{label}</span>
                <span className={done ? "flex items-center gap-1 text-emerald-600" : "text-slate-400"}>
                  {done && <CircleCheck className="h-3 w-3" />}
                  {r.have} / {r.need}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-brand"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {ladder.map((r) => {
          const tint = RANK_TINT[r.name] ?? "bg-slate-100 text-slate-600";
          if (r.state === "current") {
            return (
              <div key={r.name} className="rounded-2xl bg-depth-dark p-3 text-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-brand">
                    <Award className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-[11px] text-white/60">{t("earn.current", { n: r.stage?.current ?? 1 })}</p>
                  </div>
                  <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-medium">{t("earn.currentPill")}</span>
                </div>
                {r.stage && (
                  <div className="mt-2.5 flex gap-1.5 pl-12">
                    {Array.from({ length: r.stage.total }).map((_, i) => (
                      <span key={i} className={`h-1.5 flex-1 rounded-full ${i < r.stage!.current ? "bg-brand" : "bg-white/20"}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          }
          const locked = r.state === "locked";
          return (
            <div
              key={r.name}
              className={`flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 ${locked ? "opacity-55" : ""}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${locked ? "bg-slate-100 text-slate-400" : tint}`}>
                {locked ? <Lock className="h-[18px] w-[18px]" /> : <CircleCheck className="h-[19px] w-[19px]" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{r.name}</p>
                <p className="text-[11px] text-slate-400">
                  {t("earn.levelState", { n: r.levelIndex, state: locked ? t("earn.locked") : t("earn.unlocked") })}
                </p>
              </div>
              <span className="text-sm font-medium text-slate-500 tnum">{r.pct}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3">
        <span className="text-xs text-slate-500">{t("earn.totalToNetwork")}</span>
        <span className="text-base font-semibold text-slate-900 tnum">
          {sharePct}% <span className="text-xs font-normal text-slate-400">{t("earn.ofPv")}</span>
        </span>
      </div>
    </BottomSheet>
  );
}
