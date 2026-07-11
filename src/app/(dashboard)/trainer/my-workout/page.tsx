import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { getOrCreateSelfClient } from "@/lib/self-client";
import { getNextDayIndex, getScheduledTodayIndex } from "@/lib/workout";
import { computeMedals } from "@/lib/medals";
import { WorkoutCreator, type ClientOption } from "../workouts/new/workout-creator";
import { WorkoutBuilder } from "../workouts/new/workout-builder";
import type { DayInput } from "../workouts/actions";
import { PlanDayTabs } from "@/components/shared/plan-day-tabs";
import { ActivityRings } from "@/components/client/activity-rings";
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

  // Attività di questa settimana (anelli stile Apple)
  const weekAgo = Date.now() - 7 * 86400000;
  const wSess = sessions.filter((s) => s.completedAt.getTime() >= weekAgo);
  const weekSessions = wSess.length;
  const weekMin = wSess.reduce((a, s) => a + (s.durationMin ?? 0), 0);
  const weekCal = wSess.reduce((a, s) => a + (s.calories ?? 0), 0);
  const rings = [
    { value: weekCal, goal: 400 * weeklyGoal, color: "#FF375F", track: "#FF375F22", label: t("session.calories"), display: `${weekCal}` },
    { value: weekMin, goal: 45 * weeklyGoal, color: "#30D158", track: "#30D15822", label: t("dash.activeTime"), display: `${weekMin} ${t("dash.min")}` },
    { value: weekSessions, goal: weeklyGoal, color: "#5AC8FA", track: "#5AC8FA22", label: t("dash.workoutsLabel"), display: `${weekSessions}/${weeklyGoal}` },
  ];

  const stats = [
    { icon: Dumbbell, tint: "text-brand bg-brand/10", value: sessions.length, label: t("cd.sessions"), href: undefined as string | undefined },
    { icon: Flame, tint: "text-orange-500 bg-orange-500/10", value: totalCal, label: t("session.calories"), href: undefined },
    { icon: Timer, tint: "text-blue-500 bg-blue-500/10", value: totalMin, label: t("dash.min"), href: undefined },
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

      {/* Anelli attività della settimana (dati in modo visivo, come sul cliente) */}
      <div className="rounded-3xl glass p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 mb-4">{t("dash.thisWeek")}</h2>
        <div className="flex items-center gap-5 sm:gap-8">
          <ActivityRings rings={rings} size={140} />
          <div className="flex-1 space-y-3">
            {rings.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: r.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-slate-900 leading-none tnum">{r.display}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
