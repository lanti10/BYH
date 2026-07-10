import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { Plus, Dumbbell, CalendarDays, CalendarRange, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";

export default async function WorkoutsPage() {
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;

  const plans = await prisma.workoutPlan.findMany({
    // Esclude la scheda personale del PT (auto-cliente): si gestisce da "Il mio allenamento".
    // I template senza cliente (client null) restano visibili.
    where: { trainerId: trainer.id, NOT: { client: { userId: user.id } } },
    include: {
      client: { include: { user: true } },
      workouts: { include: { _count: { select: { exercises: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav.workouts")}</h1>
          <p className="text-slate-500 mt-1">
            {t("wk.created", { n: plans.length })}
          </p>
        </div>
        <Link
          href="/trainer/workouts/new"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" /> {t("wk.create")}
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white/50 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
            <Dumbbell className="h-7 w-7 text-brand" />
          </div>
          <p className="text-lg font-semibold text-slate-700">{t("wk.none")}</p>
          <p className="mt-1 text-sm text-slate-400">{t("wk.noneSub")}</p>
          <Link
            href="/trainer/workouts/new"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> {t("wk.create")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const totalExercises = plan.workouts.reduce((s, w) => s + w._count.exercises, 0);
            const dayCount = plan.workouts.length;
            const href = plan.clientId ? `/trainer/clients/${plan.clientId}` : `/trainer/workouts/${plan.id}`;
            return (
              <Link
                key={plan.id}
                href={href}
                className="group rounded-3xl glass p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{plan.name}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {plan.client ? plan.client.user.name || plan.client.user.email : t("wk.templateNone")}
                    </p>
                  </div>
                  {plan.isTemplate ? (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      <FileText className="h-3 w-3" /> {t("wk.template")}
                    </span>
                  ) : (
                    plan.isActive && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                        {t("wk.activeBadge")}
                      </span>
                    )
                  )}
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" /> {t("wk.daysN", { n: dayCount })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Dumbbell className="h-4 w-4" /> {t("wk.exercisesN", { n: totalExercises })}
                  </span>
                  {plan.durationWeeks && (
                    <span className="flex items-center gap-1.5">
                      <CalendarRange className="h-4 w-4" /> {t("wk.weeksShort", { n: plan.durationWeeks })}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Array.from({ length: dayCount }).map((_, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                    >
                      {t("plan.dayN", { n: i + 1 })}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-end text-sm font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                  {t("wk.open")} <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
