import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { WorkoutCreator, type ClientOption } from "./workout-creator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function ageFromBirth(birth?: Date | null): number | undefined {
  if (!birth) return undefined;
  const diff = Date.now() - new Date(birth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;
  const { client: preselectedClient } = await searchParams;

  const clientProfiles = await prisma.clientProfile.findMany({
    where: { trainerId: trainer.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const clients: ClientOption[] = clientProfiles.map((c) => ({
    id: c.id,
    name: c.user.name || c.user.email,
    age: ageFromBirth(c.birthDate),
    weight: c.startWeight,
    height: c.height,
    goals: c.goals.join(", ") || null,
  }));

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/trainer/workouts"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> {t("nav.workouts")}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{t("wk.newPlan")}</h1>
        <p className="text-slate-500 mt-1">
          {t("wk.newSub")}
        </p>
      </div>

      <WorkoutCreator clients={clients} initialClientId={preselectedClient} />
    </div>
  );
}
