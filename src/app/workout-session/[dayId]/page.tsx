import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SessionTracker } from "@/components/client/session-tracker";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "CLIENT" || !user.clientProfile) redirect("/");

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

  return (
    <SessionTracker
      dayId={day.id}
      dayName={day.name}
      weightKg={weightKg}
      planType={day.plan.planType}
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
