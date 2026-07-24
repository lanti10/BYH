import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { PlanDayTabs, type PlanDay } from "@/components/shared/plan-day-tabs";
import { loadWeightHistory } from "@/lib/weight-history";
import { getNextDayIndex, getScheduledTodayIndex } from "@/lib/workout";
import { Dumbbell, Plus } from "lucide-react";
import Link from "next/link";

export default async function ClientWorkoutPage() {
  const user = await requireRole("CLIENT");
  const { t } = await getT();
  const client = user.clientProfile;

  const plan = client
    ? await prisma.workoutPlan.findFirst({
        where: { clientId: client.id, isActive: true },
        orderBy: { createdAt: "desc" },
        include: {
          workouts: {
            orderBy: { dayOfWeek: "asc" },
            include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
          },
        },
      })
    : null;

  if (!plan) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">{t("nav.myPlan")}</h1>
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
            <Dumbbell className="h-7 w-7 text-brand" />
          </div>
          <p className="text-lg font-semibold text-slate-700">{t("dash.noPlan")}</p>
          <p className="mt-1 text-sm text-slate-400">
            {t("myplan.noPlanSub")}
          </p>
          <Link
            href="/client/workout/new"
            className="mt-5 inline-block rounded-full bg-brand px-6 py-3 text-sm font-medium text-white shadow-cta"
          >
            {t("own.cta")}
          </Link>
        </div>
      </div>
    );
  }

  const days: PlanDay[] = plan.workouts.map((w) => ({
    id: w.id,
    name: w.name,
    weekday: w.scheduledWeekday,
    durationMin: w.durationMin,
    exercises: w.exercises.map((e) => ({
      id: e.id,
      name: e.exercise.name,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      restSeconds: e.restSeconds,
      notes: e.notes,
    })),
  }));

  // Pesi registrati dal cliente sugli esercizi di questa scheda (per nome esercizio)
  const weightHistory = await loadWeightHistory(
    client!.id,
    plan.workouts.flatMap((w) => w.exercises.map((e) => e.exercise.name))
  );

  // Progressione: apri direttamente il giorno che tocca oggi
  const sessions = await prisma.workoutSession.findMany({
    where: { clientId: client!.id },
    orderBy: { completedAt: "desc" },
    take: 30,
    select: { workoutDayId: true, completedAt: true },
  });
  // Se la scheda è pianificata per giorni fissi della settimana, usa quello; altrimenti progressione ciclica
  const scheduled = getScheduledTodayIndex(plan.workouts);
  const { nextIndex: cyclicNext } = getNextDayIndex(plan.workouts, sessions);
  const nextIndex = scheduled ? scheduled.index : cyclicNext;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{plan.name}</h1>
        <Link
          href="/client/workout/new"
          className="mt-1 flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("own.cta")}
        </Link>
      </div>
      <p className="text-slate-500 mt-1 mb-6 text-sm tnum">
        {plan.durationWeeks ? t("myplan.programWeeks", { n: plan.durationWeeks }) + " · " : ""}
        {t("myplan.todayIs", { n: nextIndex + 1 })}
      </p>
      {plan.description && (
        <p className="rounded-2xl glass p-4 text-sm text-slate-600 mb-6">
          {plan.description}
        </p>
      )}
      <PlanDayTabs
        days={days}
        canStart
        todayIndex={scheduled?.restToday ? undefined : nextIndex}
        planType={plan.planType}
        editableWeight
        weightHistory={weightHistory}
      />
    </div>
  );
}
