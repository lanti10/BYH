"use client";

// Schermata di chiusura dell'allenamento: prima non esisteva, la sessione finiva
// e basta. È il momento in cui la voglia di raccontarlo è al massimo, quindi è da
// qui che parte la condivisione.

import { useState } from "react";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { ShareSheet, type ShareInput } from "@/components/shared/share-sheet";
import type { ShareVariant } from "@/lib/share-card";

export type SessionSummary = {
  dayName: string;
  streakDays: number;
  totalSessions: number;
  durationMin: number;
  exerciseCount: number;
  volumeKg: number;
  medal: { id: string; icon: string; color: string; title: string; target: number } | null;
  record: { exercise: string; weight: number; delta: number; previous: number } | null;
};

export function SessionDone({
  summary,
  shareUrl,
  onClose,
}: {
  summary: SessionSummary;
  shareUrl: string;
  onClose: () => void;
}) {
  const { t } = useT();
  const [sharing, setSharing] = useState(false);

  const input: ShareInput = {
    url: shareUrl,
    eyebrow: summary.dayName,
    streakDays: summary.streakDays,
    durationMin: summary.durationMin,
    exerciseCount: summary.exerciseCount,
    volumeTons: summary.volumeKg / 1000,
    medalIcon: summary.medal?.icon,
    medalColor: summary.medal?.color,
    medalTitle: summary.medal ? t(summary.medal.title) : undefined,
    medalSubtitle: summary.medal ? `${summary.totalSessions} ${t("share.workouts").toLowerCase()}` : undefined,
    recordWeightKg: summary.record?.weight,
    recordExercise: summary.record?.exercise,
    recordDeltaKg: summary.record?.delta,
    recordPrevious: summary.record ? `${t("share.previous")}: ${summary.record.previous} kg` : undefined,
  };

  // Il taglio più raro apre per primo: un massimale battuto o una medaglia sono
  // una notizia, un allenamento normale no.
  const variants: ShareVariant[] = [
    ...(summary.record ? (["record"] as const) : []),
    ...(summary.medal ? (["medal"] as const) : []),
    "rings",
    "photo",
  ];

  const shareText = summary.medal
    ? `${t("share.textMedal")} ${shareUrl}`
    : summary.streakDays > 1
      ? `${t("share.textStreak", { n: summary.streakDays })} ${shareUrl}`
      : `${t("share.text")} ${shareUrl}`;

  const stats: [string, string][] = [
    [String(summary.durationMin), t("dash.min")],
    [String(summary.exerciseCount), t("session.exercises").toLowerCase()],
    [String(summary.streakDays), t("dash.days")],
  ];

  return (
    <>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="h-8 w-8 text-emerald-400" strokeWidth={3} />
        </div>
        <h2 className="mt-5 text-[28px] font-bold tracking-tight text-white">{t("share.done")}</h2>
        <p className="mt-1 text-sm text-white/50">{summary.dayName || t("share.doneSub")}</p>

        <div className="mt-8 flex w-full max-w-xs items-start justify-between">
          {stats.map(([value, label]) => (
            <div key={label} className="flex-1">
              <p className="text-[30px] font-bold leading-none text-white tnum">{value}</p>
              <p className="mt-1 text-[11px] text-white/45">{label}</p>
            </div>
          ))}
        </div>

        {summary.medal && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: summary.medal.color }} />
            <p className="text-sm font-semibold text-white">{t(summary.medal.title)}</p>
          </div>
        )}

        <button
          onClick={() => setSharing(true)}
          className="mt-10 flex h-[50px] w-full max-w-xs items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white shadow-cta transition-colors hover:bg-brand-hover"
        >
          {t("share.cta")}
        </button>
        <button onClick={onClose} className="mt-3 py-2 text-sm font-medium text-white/50">
          {t("share.close")}
        </button>
      </div>

      {sharing && (
        <ShareSheet input={input} variants={variants} shareText={shareText} onClose={() => setSharing(false)} />
      )}
    </>
  );
}
