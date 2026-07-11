import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { ProgressView, type Sess } from "@/components/client/progress-view";
import { SessionHistory, type HistSession } from "@/components/shared/session-history";
import { MedalBadge } from "@/components/client/medal-badge";
import { computeMedals } from "@/lib/medals";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function ClientProgressPage() {
  const user = await requireRole("CLIENT");
  const { t } = await getT();
  const client = user.clientProfile;

  if (!client) {
    return (
      <div className="p-4 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">{t("prog.title")}</h1>
        <p className="text-slate-400 mt-4 text-sm">{t("msgs.notLinked")}</p>
      </div>
    );
  }

  const rawSessions = await prisma.workoutSession.findMany({
    where: { clientId: client.id },
    orderBy: { completedAt: "desc" },
    include: {
      workoutDay: {
        include: {
          plan: { select: { planType: true } },
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: { select: { name: true } } },
          },
        },
      },
    },
    take: 400,
  });

  const sessions: Sess[] = rawSessions.map((s) => ({
    id: s.id,
    date: s.completedAt.toISOString(),
    min: s.durationMin ?? 0,
    cal: s.calories ?? 0,
    hr: s.avgHeartRate,
    name: s.workoutDay?.name || "Allenamento",
  }));

  // Storico allenamenti (stesso layout della pagina Workout del PT, con i dati del cliente)
  const history: HistSession[] = rawSessions.map((s) => ({
    id: s.id,
    date: s.completedAt.toISOString(),
    name: s.workoutDay?.name ?? "",
    min: s.durationMin ?? 0,
    cal: s.calories ?? 0,
    hr: s.avgHeartRate ?? null,
    planType: s.workoutDay?.plan?.planType ?? "WEIGHTS",
    exercises: (s.workoutDay?.exercises ?? []).map((e) => ({
      name: e.exercise.name,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      restSeconds: e.restSeconds,
      notes: e.notes,
    })),
  }));

  // Obiettivi anelli presi dalla scheda attiva (durata + calorie impostate dal trainer)
  const activePlan = await prisma.workoutPlan.findFirst({
    where: { clientId: client.id, isActive: true },
    select: { workouts: { select: { durationMin: true, targetCalories: true } } },
  });
  const planMin = activePlan?.workouts.map((w) => w.durationMin).find((v) => v != null) ?? null;
  const planCal = activePlan?.workouts.map((w) => w.targetCalories).find((v) => v != null) ?? null;

  const weeklyGoal = client.trainingDaysPerWeek ?? 3;
  const medals = computeMedals(
    rawSessions.map((s) => ({ completedAt: s.completedAt })),
    weeklyGoal
  );
  const unlocked = medals.filter((m) => m.unlocked);
  const medalPreview = [...unlocked, ...medals.filter((m) => !m.unlocked)].slice(0, 4);

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">{t("prog.title")}</h1>
        <span className="text-sm text-slate-400 tnum">{t("prog.medalsCount", { a: unlocked.length, b: medals.length })}</span>
      </div>

      <ProgressView sessions={sessions} weeklyGoal={weeklyGoal} planMin={planMin} planCal={planCal} />

      {/* Storico allenamenti: fiches per mese, tap = dettaglio (come nel Workout del PT) */}
      <section className="pt-1">
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h2 className="font-semibold text-slate-900">{t("hist.title")}</h2>
          <span className="text-sm text-slate-400 tnum">{sessions.length}</span>
        </div>
        <SessionHistory sessions={history} />
      </section>

      {/* Medagliere (anteprima) */}
      <Link
        href="/client/medals"
        className="block rounded-3xl glass p-5 sm:p-6 transition-shadow hover:shadow-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">{t("medals.title")}</h2>
          <span className="text-sm font-semibold text-brand">
            {t("prog.all")} <ChevronRight className="inline h-3.5 w-3.5 -mt-0.5" />
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {medalPreview.map((m) => (
            <MedalBadge key={m.id} medal={m} size={64} />
          ))}
        </div>
      </Link>
    </div>
  );
}
