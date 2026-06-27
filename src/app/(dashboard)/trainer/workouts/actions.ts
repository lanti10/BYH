"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ExerciseInput = {
  name: string;
  sets: number;
  reps: string;
  weight?: number | null;
  restSeconds: number;
};

export type DayInput = {
  name: string;
  exercises: ExerciseInput[];
};

export type CreatePlanInput = {
  clientId?: string | null; // null/vuoto = modello (nessun cliente)
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

  if (!input.name?.trim()) return { ok: false, error: "Dai un nome alla scheda." };

  const clientId = input.clientId?.trim() || null;
  const isTemplate = !clientId;

  // Se assegnata a un cliente, verifica che appartenga al trainer
  if (clientId) {
    const client = await prisma.clientProfile.findFirst({
      where: { id: clientId, trainerId },
    });
    if (!client) return { ok: false, error: "Cliente non valido." };
  }

  const validDays = input.days
    .map((d) => ({ ...d, exercises: d.exercises.filter((e) => e.name.trim()) }))
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

  // Se assegnata a un cliente, disattiva le sue schede attive precedenti
  if (clientId) {
    await prisma.workoutPlan.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    });
  }

  const plan = await prisma.workoutPlan.create({
    data: {
      trainerId,
      clientId,
      isTemplate,
      isActive: !isTemplate,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      workouts: {
        create: validDays.map((d, dayIndex) => ({
          name: d.name.trim() || `Giorno ${dayIndex + 1}`,
          dayOfWeek: dayIndex, // usato come numero del giorno di allenamento (0-based)
          exercises: {
            create: d.exercises.map((e, i) => ({
              exerciseId: exerciseIdByName.get(e.name.trim())!,
              sets: e.sets || 3,
              reps: e.reps.trim() || "10",
              weight: e.weight != null && !Number.isNaN(e.weight) ? e.weight : null,
              restSeconds: e.restSeconds || 60,
              order: i,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/trainer/workouts");
  if (clientId) revalidatePath(`/trainer/clients/${clientId}`);
  return { ok: true, planId: plan.id };
}
