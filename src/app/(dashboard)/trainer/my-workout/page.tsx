import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { getOrCreateSelfClient } from "@/lib/self-client";
import { getNextDayIndex, getScheduledTodayIndex } from "@/lib/workout";
import { computeMedals } from "@/lib/medals";
import { WorkoutCreator, type ClientOption } from "../workouts/new/workout-creator";
import { PlanDayTabs } from "@/components/shared/plan-day-tabs";
import { MedalBadge } from "@/components/client/medal-badge";
import { Plus, Flame, Timer, Dumbbell, Trophy } from "lucide-react";
import Link from "next/link";

// "Il mio allenamento" del PT: crea la propria scheda e la segue come un cliente.
// Riusa l'auto-cliente (vedi src/lib/self-client.ts) → schede, tracker, progressi.
export default async function MyWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;
  const { new: forceNew } = await searchParams;

  const self = await getOrCreateSelfClient(user.id, trainer.id);

  const activePlan = await prisma.workoutPlan.findFirst({
    where: { clientId: self.id, isActive: true },
    include: {
      workouts: {
        orderBy: { dayOfWeek: "asc" },
        include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const sessions = await prisma.workoutSession.findMany({
    where: { clientId: self.id },
    orderBy: { completedAt: "desc" },
    take: 400,
  });

  // Nessuna scheda (o richiesta esplicita di crearne una nuova) → creatore, scoped al PT
  if (!activePlan || forceNew) {
    const selfOption: ClientOption = { id: self.id, name: user.name || t("nav.myWorkout") };
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav.myWorkout")}</h1>
          <p className="text-slate-500 mt-1">{t("myw.createSub")}</p>
        </div>
        <WorkoutCreator
          clients={[selfOption]}
          initialClientId={self.id}
          hideClientSelect
          redirectTo="/trainer/my-workout"
        />
      </div>
    );
  }

  // Scheda attiva → vista allenamento in stile cliente
  const days = activePlan.workouts;
  const scheduled = getScheduledTodayIndex(days);
  const cyclic = getNextDayIndex(days, sessions);
  const todayIndex = scheduled ? scheduled.index : cyclic.nextIndex;

  // Progressi + medaglie (come vede un cliente)
  const totalMin = sessions.reduce((a, s) => a + (s.durationMin ?? 0), 0);
  const totalCal = sessions.reduce((a, s) => a + (s.calories ?? 0), 0);
  const medals = computeMedals(sessions, self.trainingDaysPerWeek ?? 3);
  const unlockedMedals = medals.filter((m) => m.unlocked);
  const stats = [
    { icon: Dumbbell, tint: "text-brand bg-brand/10", value: sessions.length, label: t("cd.sessions") },
    { icon: Flame, tint: "text-orange-500 bg-orange-500/10", value: totalCal, label: t("session.calories") },
    { icon: Timer, tint: "text-blue-500 bg-blue-500/10", value: totalMin, label: t("dash.min") },
    { icon: Trophy, tint: "text-amber-500 bg-amber-500/10", value: unlockedMedals.length, label: t("nav.medals") },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav.myWorkout")}</h1>
          <p className="text-slate-500 mt-1">{activePlan.name}</p>
        </div>
        <Link
          href="/trainer/my-workout?new=1"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
        >
          <Plus className="h-4 w-4" /> {t("myw.newPlan")}
        </Link>
      </div>

      <PlanDayTabs
        planType={activePlan.planType}
        todayIndex={todayIndex}
        startHrefBase="/workout-session"
        days={days.map((day) => ({
          id: day.id,
          name: day.name,
          weekday: day.scheduledWeekday,
          exercises: day.exercises.map((ex) => ({
            id: ex.id,
            name: ex.exercise.name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
          })),
        }))}
      />

      {/* Progressi (come un cliente) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl glass p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl mb-2 ${s.tint}`}>
              <s.icon className="h-4 w-4" />
            </span>
            <p className="text-2xl font-bold text-slate-900 leading-none tnum">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Medaglie sbloccate */}
      {unlockedMedals.length > 0 && (
        <div className="rounded-3xl glass p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400 mb-4">
            {t("medals.unlocked")}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {unlockedMedals.map((m) => (
              <MedalBadge key={m.id} medal={m} size={72} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
