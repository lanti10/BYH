import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanDayTabs, type PlanDay } from "@/components/shared/plan-day-tabs";
import { PlanActions } from "@/components/trainer/plan-actions";
import { AssignTemplate } from "@/components/trainer/assign-template";
import { ArrowLeft, FileText, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function WorkoutDetailPage({
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
        <ArrowLeft className="h-4 w-4" /> Schede
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
            <FileText className="h-4 w-4" /> Modello (nessun cliente)
          </>
        )}
      </p>

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
