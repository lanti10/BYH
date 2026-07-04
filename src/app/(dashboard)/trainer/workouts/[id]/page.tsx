import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { PlanDayTabs, type PlanDay } from "@/components/shared/plan-day-tabs";
import { PlanActions } from "@/components/trainer/plan-actions";
import { AssignTemplate } from "@/components/trainer/assign-template";
import { ArrowLeft, FileText, User, CalendarRange } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DATE_LOCALE } from "@/lib/i18n/dict";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("TRAINER");
  const { t, locale } = await getT();
  const trainer = user.trainerProfile!;
  const { id } = await params;

  const [plan, clientProfiles] = await Promise.all([
    prisma.workoutPlan.findFirst({
      where: { id, trainerId: trainer.id },
      include: {
        client: { include: { user: true } },
        workouts: {
          orderBy: { dayOfWeek: "asc" },
          include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
        },
      },
    }),
    prisma.clientProfile.findMany({
      where: { trainerId: trainer.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!plan) notFound();

  const clients = clientProfiles.map((c) => ({ id: c.id, name: c.user.name || c.user.email }));

  const days: PlanDay[] = plan.workouts.map((w) => ({
    id: w.id,
    name: w.name,
    exercises: w.exercises.map((e) => ({
      id: e.id,
      name: e.exercise.name,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      restSeconds: e.restSeconds,
    })),
  }));

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <Link
        href="/trainer/workouts"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> {t("nav.workouts")}
      </Link>

      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold text-slate-900">{plan.name}</h1>
        <PlanActions planId={plan.id} />
      </div>
      <p className="flex items-center gap-1.5 text-slate-500 mb-6 text-sm">
        {plan.client ? (
          <>
            <User className="h-4 w-4" /> {plan.client.user.name || plan.client.user.email}
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" /> {t("wk.templateNone")}
          </>
        )}
        {plan.durationWeeks && (
          <>
            <span className="text-slate-300">·</span>
            <CalendarRange className="h-4 w-4" /> {t("pd.weeks", { n: plan.durationWeeks })}
          </>
        )}
      </p>

      {plan.startDate && (
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="rounded-2xl glass px-4 py-2.5">
            <p className="text-xs text-slate-400">{t("pd.start")}</p>
            <p className="font-semibold text-slate-800">
              {plan.startDate.toLocaleDateString(DATE_LOCALE[locale], { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          {plan.endDate && (
            <div className="rounded-2xl glass px-4 py-2.5">
              <p className="text-xs text-slate-400">{t("pd.end")}</p>
              <p className="font-semibold text-slate-800">
                {plan.endDate.toLocaleDateString(DATE_LOCALE[locale], { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
      )}

      {plan.description && (
        <p className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600 mb-6">
          {plan.description}
        </p>
      )}

      {!plan.clientId && (
        <div className="mb-6">
          <AssignTemplate planId={plan.id} clients={clients} />
        </div>
      )}

      <PlanDayTabs days={days} />
    </div>
  );
}
