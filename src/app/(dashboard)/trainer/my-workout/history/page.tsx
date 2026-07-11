import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { getOrCreateSelfClient } from "@/lib/self-client";
import { SessionHistory, type HistSession } from "@/components/shared/session-history";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Storico allenamenti del PT (auto-cliente): tutte le sessioni raggruppate per mese,
// dal mese corrente fino all'inizio. Ogni fiche apre il dettaglio dell'allenamento.
export default async function MyWorkoutHistoryPage() {
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;
  const self = await getOrCreateSelfClient(user.id, trainer.id);

  const sessions = await prisma.workoutSession.findMany({
    where: { clientId: self.id },
    orderBy: { completedAt: "desc" },
    take: 500,
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
  });

  const data: HistSession[] = sessions.map((s) => ({
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <div>
        <Link
          href="/trainer/my-workout"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" /> {t("nav.myWorkout")}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{t("hist.title")}</h1>
        <p className="mt-1 text-slate-500 tnum">
          {t("cd.sessions")} · {data.length}
        </p>
      </div>

      <SessionHistory sessions={data} />
    </div>
  );
}
