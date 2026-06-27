import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkoutBuilder } from "../../new/workout-builder";
import type { DayInput } from "../../actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("TRAINER");
  const trainer = user.trainerProfile!;
  const { id } = await params;

  const [plan, clientProfiles] = await Promise.all([
    prisma.workoutPlan.findFirst({
      where: { id, trainerId: trainer.id },
      include: {
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

  const initialDays: DayInput[] = plan.workouts.map((w) => ({
    name: w.name,
    exercises: w.exercises.map((e) => ({
      name: e.exercise.name,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      restSeconds: e.restSeconds,
    })),
  }));

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/trainer/workouts/${plan.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Annulla
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Modifica scheda</h1>
      </div>

      <WorkoutBuilder
        clients={clients}
        planId={plan.id}
        initialClientId={plan.clientId ?? ""}
        initialName={plan.name}
        initialDescription={plan.description ?? ""}
        initialDurationWeeks={plan.durationWeeks}
        initialDays={initialDays}
      />
    </div>
  );
}
