import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { getOrCreateSelfClient } from "@/lib/self-client";
import { getNextDayIndex, getScheduledTodayIndex } from "@/lib/workout";
import { computeMedals } from "@/lib/medals";
import { WorkoutCreator, type ClientOption } from "../workouts/new/workout-creator";
import { WorkoutBuilder } from "../workouts/new/workout-builder";
import type { DayInput } from "../workouts/actions";
import { PlanDayTabs, type WeightEntry } from "@/components/shared/plan-day-tabs";
import { WorkoutRings } from "@/components/trainer/workout-rings";
import { Pencil, ArrowLeft, Flame, Timer, Dumbbell, Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";

// "Il mio allenamento" del PT: crea la propria scheda e la segue come un cliente.
// Riusa l'auto-cliente (vedi src/lib/self-client.ts) → schede, tracker, progressi.
export default async function MyWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string }>;
}) {
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;
  const { new: forceNew, edit } = await searchParams;

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

  // Modifica della propria scheda (builder in edit, precompilato, sempre sulla stessa pagina)
  if (edit) {
    const initialDays: DayInput[] = activePlan.workouts.map((w) => ({
      name: w.name,
      weekday: w.scheduledWeekday,
      durationMin: w.durationMin,
      targetCalories: w.targetCalories,
      exercises: w.exercises.map((e) => ({
        name: e.exercise.name,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        restSeconds: e.restSeconds,
        notes: e.notes,
      })),
    }));
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/trainer/my-workout"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3"
          >
            <ArrowLeft className="h-4 w-4" /> {t("common.cancel")}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{t("pd.editPlan")}</h1>
        </div>
        <WorkoutBuilder
          clients={[{ id: self.id, name: user.name || t("nav.myWorkout") }]}
          planId={activePlan.id}
          initialClientId={self.id}
          initialName={activePlan.name}
          initialPlanType={activePlan.planType}
          initialDescription={activePlan.description ?? ""}
          initialDurationWeeks={activePlan.durationWeeks}
          initialStartDate={activePlan.startDate ? activePlan.startDate.toISOString().slice(0, 10) : undefined}
          initialDays={initialDays}
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
  const weeklyGoal = self.trainingDaysPerWeek ?? 3;
  const totalMin = sessions.reduce((a, s) => a + (s.durationMin ?? 0), 0);
  const totalCal = sessions.reduce((a, s) => a + (s.calories ?? 0), 0);
  const medals = computeMedals(sessions, weeklyGoal);
  const unlockedMedals = medals.filter((m) => m.unlocked);

  // Obiettivi presi dalla scheda (durata + calorie impostate dal trainer), con fallback
  const planMin = activePlan.workouts.map((w) => w.durationMin).find((v) => v != null) ?? 45;
  const planCal = activePlan.workouts.map((w) => w.targetCalories).find((v) => v != null) ?? 400;

  // Pesi che il PT registra sulla propria scheda (si allena come auto-cliente)
  const wLogs = await prisma.exerciseWeightLog.findMany({
    where: {
      clientId: self.id,
      workoutExerciseId: { in: days.flatMap((d) => d.exercises.map((e) => e.id)) },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { workoutExerciseId: true, weight: true, createdAt: true },
  });
  const weightHistory: Record<string, WeightEntry[]> = {};
  for (const l of wLogs) {
    (weightHistory[l.workoutExerciseId] ??= []).push({
      weight: l.weight,
      date: l.createdAt.toISOString(),
    });
  }

  // Dati sessioni per gli anelli (toggle Oggi/Settimana, settimana lun–dom)
  const ringSessions = sessions.map((s) => ({
    ts: s.completedAt.getTime(),
    min: s.durationMin ?? 0,
    cal: s.calories ?? 0,
  }));

  const stats = [
    { icon: Timer, tint: "text-blue-500 bg-blue-500/10", value: totalMin, label: t("dash.min"), href: undefined as string | undefined },
    { icon: Flame, tint: "text-orange-500 bg-orange-500/10", value: totalCal, label: t("session.calories"), href: undefined },
    { icon: Dumbbell, tint: "text-brand bg-brand/10", value: sessions.length, label: t("cd.sessions"), href: "/trainer/my-workout/history" },
    { icon: Trophy, tint: "text-amber-500 bg-amber-500/10", value: unlockedMedals.length, label: t("nav.medals"), href: "/trainer/medals" },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav.myWorkout")}</h1>
          <p className="text-slate-500 mt-1">{activePlan.name}</p>
        </div>
        <Link
          href="/trainer/my-workout?edit=1"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
        >
          <Pencil className="h-4 w-4" /> {t("myw.editPlan")}
        </Link>
      </div>

      <PlanDayTabs
        planType={activePlan.planType}
        todayIndex={todayIndex}
        startHrefBase="/workout-session"
        editableWeight
        weightHistory={weightHistory}
        days={days.map((day) => ({
          id: day.id,
          name: day.name,
          weekday: day.scheduledWeekday,
          durationMin: day.durationMin,
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

      {/* Anelli attività: toggle Oggi / Settimana (la settimana si azzera ogni lunedì) */}
      <WorkoutRings
        sessions={ringSessions}
        weeklyGoal={weeklyGoal}
        planMin={planMin}
        planCal={planCal}
      />

      {/* Widget totali (l'ultimo, Medaglie, porta al medagliere) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => {
          const inner = (
            <>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl mb-2 ${s.tint}`}>
                <s.icon className="h-4 w-4" />
              </span>
              <p className="text-2xl font-bold text-slate-900 leading-none tnum">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-0.5">
                {s.label}
                {s.href && <ChevronRight className="h-3 w-3 text-slate-300" />}
              </p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="rounded-3xl glass p-4 transition-shadow hover:shadow-md">
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="rounded-3xl glass p-4">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
