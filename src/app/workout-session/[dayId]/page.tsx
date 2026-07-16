import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SessionTracker } from "@/components/client/session-tracker";
import type { WeightEntry } from "@/components/shared/exercise-weight-editor";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  // Sia i clienti sia il PT (auto-cliente) possono allenarsi sulle proprie schede.
  if (!user.clientProfile) redirect("/");

  const { dayId } = await params;

  const day = await prisma.workoutDay.findFirst({
    where: { id: dayId, plan: { clientId: user.clientProfile.id } },
    include: {
      plan: { select: { planType: true } },
      exercises: { orderBy: { order: "asc" }, include: { exercise: true } },
    },
  });
  if (!day) notFound();

  // Peso più recente per stimare le calorie
  const lastLog = await prisma.progressLog.findFirst({
    where: { clientId: user.clientProfile.id, weight: { not: null } },
    orderBy: { date: "desc" },
  });
  const weightKg = lastLog?.weight ?? user.clientProfile.startWeight ?? 70;

  // Il PT si allena come auto-cliente: abbassando la tendina (o finendo) deve tornare
  // nella SUA area, non in quella cliente.
  // Pesi già registrati sugli esercizi di oggi: si vedono e si aggiornano nel dettaglio
  const wLogs = await prisma.exerciseWeightLog.findMany({
    where: {
      clientId: user.clientProfile.id,
      workoutExerciseId: { in: day.exercises.map((e) => e.id) },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { workoutExerciseId: true, weight: true, createdAt: true },
  });
  const weightHistory: Record<string, WeightEntry[]> = {};
  for (const l of wLogs) {
    (weightHistory[l.workoutExerciseId] ??= []).push({
      weight: l.weight,
      date: l.createdAt.toISOString(),
    });
  }

  const isTrainer = user.role === "TRAINER";
  const homeHref = isTrainer ? "/trainer/my-workout" : "/client";
  const doneHref = isTrainer ? "/trainer/my-workout" : "/client/progress";

  return (
    <SessionTracker
      dayId={day.id}
      dayName={day.name}
      weightKg={weightKg}
      planType={day.plan.planType}
      homeHref={homeHref}
      doneHref={doneHref}
      weightHistory={weightHistory}
      exercises={day.exercises.map((e) => ({
        id: e.id,
        name: e.exercise.name,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        restSeconds: e.restSeconds,
        notes: e.notes,
      }))}
    />
  );
}
