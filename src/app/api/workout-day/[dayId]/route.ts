import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Dati di un giorno di scheda per l'allenamento in corso.
// Serve perché il tracker non è più una pagina ma un overlay dentro l'app: i dati
// non arrivano più dal server component, se li prende lui all'apertura.
export async function GET(_req: Request, { params }: { params: Promise<{ dayId: string }> }) {
  const user = await getCurrentUser();
  // Sia i clienti sia il PT (auto-cliente) si allenano sulle proprie schede.
  if (!user?.clientProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dayId } = await params;

  const day = await prisma.workoutDay.findFirst({
    where: { id: dayId, plan: { clientId: user.clientProfile.id } },
    include: {
      plan: { select: { planType: true } },
      exercises: { orderBy: { order: "asc" }, include: { exercise: { select: { name: true } } } },
    },
  });
  if (!day) return NextResponse.json({ error: "Giorno non valido" }, { status: 404 });

  // Peso corporeo più recente: serve a stimare le calorie
  const lastLog = await prisma.progressLog.findFirst({
    where: { clientId: user.clientProfile.id, weight: { not: null } },
    orderBy: { date: "desc" },
    select: { weight: true },
  });

  const wLogs = await prisma.exerciseWeightLog.findMany({
    where: {
      clientId: user.clientProfile.id,
      workoutExerciseId: { in: day.exercises.map((e) => e.id) },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { workoutExerciseId: true, weight: true, createdAt: true },
  });
  const weightHistory: Record<string, { weight: number; date: string }[]> = {};
  for (const l of wLogs) {
    (weightHistory[l.workoutExerciseId] ??= []).push({
      weight: l.weight,
      date: l.createdAt.toISOString(),
    });
  }

  return NextResponse.json({
    dayId: day.id,
    dayName: day.name,
    planType: day.plan.planType,
    weightKg: lastLog?.weight ?? user.clientProfile.startWeight ?? 70,
    doneHref: user.role === "TRAINER" ? "/trainer/my-workout" : "/client/progress",
    exercises: day.exercises.map((e) => ({
      id: e.id,
      name: e.exercise.name,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      restSeconds: e.restSeconds,
      notes: e.notes,
    })),
    weightHistory,
  });
}
