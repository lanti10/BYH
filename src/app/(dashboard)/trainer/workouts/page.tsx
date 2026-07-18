import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { Plus, Dumbbell } from "lucide-react";
import Link from "next/link";
import { WorkoutsList, type PlanRow } from "@/components/trainer/workouts-list";

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

  const rows: PlanRow[] = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    clientName: plan.client ? plan.client.user.name || plan.client.user.email : null,
    isTemplate: plan.isTemplate,
    isActive: plan.isActive,
    planType: plan.planType,
    dayCount: plan.workouts.length,
    totalExercises: plan.workouts.reduce((s, w) => s + w._count.exercises, 0),
    durationWeeks: plan.durationWeeks,
  }));

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
        <WorkoutsList plans={rows} />
      )}
    </div>
  );
}
