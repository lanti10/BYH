import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { getOrCreateSelfClient } from "@/lib/self-client";
import { computeMedals } from "@/lib/medals";
import { MedalBadge } from "@/components/client/medal-badge";
import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";

// Medagliere personale del PT (dalle sue sessioni via auto-cliente).
export default async function TrainerMedalsPage() {
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;
  const self = await getOrCreateSelfClient(user.id, trainer.id);

  const sessions = await prisma.workoutSession.findMany({
    where: { clientId: self.id },
    select: { completedAt: true },
    take: 400,
  });
  const weeklyGoal = self.trainingDaysPerWeek ?? 3;
  const medals = computeMedals(sessions, weeklyGoal);
  const unlocked = medals.filter((m) => m.unlocked);
  const locked = medals.filter((m) => !m.unlocked);

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/trainer/my-workout"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> {t("nav.myWorkout")}
        </Link>
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">{t("medals.title")}</h1>
        <p className="text-slate-500 mt-1 text-sm tnum">
          {t("medals.unlockedOf", { a: unlocked.length, b: medals.length })}
        </p>
      </div>

      <div className="rounded-3xl bg-depth-dark p-6 text-white text-center">
        <Trophy className="mx-auto h-8 w-8 text-[#FFD60A] mb-2" />
        <p className="text-4xl font-bold tnum">{unlocked.length}</p>
        <p className="text-sm text-white/50 mt-1">{t("medals.trophies")}</p>
      </div>

      {unlocked.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400 mb-4">
            {t("medals.unlocked")}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {unlocked.map((m) => (
              <MedalBadge key={m.id} medal={m} size={80} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400 mb-4">
          {t("medals.locked")}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {locked.map((m) => (
            <MedalBadge key={m.id} medal={m} size={80} />
          ))}
        </div>
      </div>

      {/* Legenda traguardi */}
      <div className="rounded-3xl glass p-5">
        <h2 className="font-semibold text-slate-900 mb-3">{t("medals.how")}</h2>
        <div className="space-y-2.5">
          {medals.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: m.unlocked ? m.color : "#C7C7CC" }}
              />
              <span className={`text-sm ${m.unlocked ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                {t(m.title)}
              </span>
              <span className="ml-auto text-xs text-slate-400 text-right">{t(m.description, { n: weeklyGoal })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
