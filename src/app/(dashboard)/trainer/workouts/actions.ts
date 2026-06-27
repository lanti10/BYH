"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ExerciseInput = {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
};

export type DayInput = {
  name: string;
  dayOfWeek: number; // 0=Lun ... 6=Dom
  exercises: ExerciseInput[];
};

export type CreatePlanInput = {
  clientId: string;
  name: string;
  description?: string;
  days: DayInput[];
};

export type CreatePlanResult = { ok: boolean; error?: string; planId?: string };

export async function createWorkoutPlan(input: CreatePlanInput): Promise<CreatePlanResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "TRAINER" || !user.trainerProfile) {
    return { ok: false, error: "Non autorizzato." };
  }
  const trainerId = user.trainerProfile.id;

  if (!input.clientId) return { ok: false, error: "Seleziona un cliente." };
  if (!input.name?.trim()) return { ok: false, error: "Dai un nome alla scheda." };

  // Verifica che il cliente appartenga al trainer
  const client = await prisma.clientProfile.findFirst({
    where: { id: input.clientId, trainerId },
  });
  if (!client) return { ok: false, error: "Cliente non valido." };

  const validDays = input.days
    .map((d) => ({
      ...d,
      exercises: d.exercises.filter((e) => e.name.trim()),
    }))
    .filter((d) => d.exercises.length > 0);

  if (validDays.length === 0) {
    return { ok: false, error: "Aggiungi almeno un giorno con un esercizio." };
  }

  // Trova o crea gli esercizi (per nome)
  const uniqueNames = [
    ...new Set(validDays.flatMap((d) => d.exercises.map((e) => e.name.trim()))),
  ];
  const exerciseIdByName = new Map<string, string>();
  for (const name of uniqueNames) {
    const existing = await prisma.exercise.findFirst({ where: { name } });
    if (existing) {
      exerciseIdByName.set(name, existing.id);
    } else {
      const created = await prisma.exercise.create({
        data: { name, category: "STRENGTH", isCustom: true, createdBy: trainerId },
      });
      exerciseIdByName.set(name, created.id);
    }
  }

  // Disattiva eventuali schede attive precedenti dello stesso cliente
  await prisma.workoutPlan.updateMany({
    where: { clientId: client.id, isActive: true },
    data: { isActive: false },
  });

  const plan = await prisma.workoutPlan.create({
    data: {
      trainerId,
      clientId: client.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      isActive: true,
      workouts: {
        create: validDays.map((d) => ({
          name: d.name.trim() || "Allenamento",
          dayOfWeek: d.dayOfWeek,
          exercises: {
            create: d.exercises.map((e, i) => ({
              exerciseId: exerciseIdByName.get(e.name.trim())!,
              sets: e.sets || 3,
              reps: e.reps.trim() || "10",
              restSeconds: e.restSeconds || 60,
              order: i,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/trainer/workouts");
  revalidatePath(`/trainer/clients/${client.id}`);
  return { ok: true, planId: plan.id };
}
