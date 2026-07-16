"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import type { PlanType } from "@prisma/client";

export type ExerciseInput = {
  name: string;
  sets: number;
  reps: string;
  weight?: number | null;
  restSeconds: number;
  notes?: string | null;
};

export type DayInput = {
  name: string;
  weekday?: number | null; // giorno della settimana fissato (1=Lun..7=Dom); null = non pianificato
  durationMin?: number | null; // durata allenamento in minuti (impostata dal trainer); null = usa la stima
  targetCalories?: number | null; // calorie da bruciare (impostate dal trainer); null = obiettivo di default
  exercises: ExerciseInput[];
};

export type CreatePlanInput = {
  clientId?: string | null; // null/vuoto = modello (nessun cliente)
  name: string;
  planType?: PlanType;
  description?: string;
  durationWeeks?: number | null;
  startDate?: string | null; // ISO "yyyy-mm-dd"
  days: DayInput[];
};

// Calcola inizio e fine dalla data di partenza + durata in settimane
function computeDates(startDate?: string | null, durationWeeks?: number | null) {
  const start = startDate ? new Date(startDate) : new Date();
  const end =
    durationWeeks && durationWeeks > 0
      ? new Date(start.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000)
      : null;
  return { start, end };
}

export type CreatePlanResult = { ok: boolean; error?: string; planId?: string };

async function getTrainer() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TRAINER" || !user.trainerProfile) return null;
  return user.trainerProfile;
}

// Pulisce i giorni vuoti e mappa i nomi degli esercizi a id (find-or-create)
async function buildWorkoutsCreate(days: DayInput[], trainerId: string, planType: PlanType) {
  const validDays = days
    .map((d) => ({ ...d, exercises: d.exercises.filter((e) => e.name.trim()) }))
    .filter((d) => d.exercises.length > 0);

  if (validDays.length === 0) return null;

  // Categoria di default per gli esercizi appena creati, in base al tipo di scheda
  const defaultCategory = planType === "SWIMMING" ? "CARDIO" : "STRENGTH";

  const uniqueNames = [...new Set(validDays.flatMap((d) => d.exercises.map((e) => e.name.trim())))];
  const exerciseIdByName = new Map<string, string>();
  for (const name of uniqueNames) {
    const existing = await prisma.exercise.findFirst({ where: { name } });
    if (existing) {
      exerciseIdByName.set(name, existing.id);
    } else {
      const created = await prisma.exercise.create({
        data: { name, category: defaultCategory, isCustom: true, createdBy: trainerId },
      });
      exerciseIdByName.set(name, created.id);
    }
  }

  return validDays.map((d, dayIndex) => ({
    name: d.name.trim() || `Giorno ${dayIndex + 1}`,
    dayOfWeek: dayIndex, // numero del giorno di allenamento (0-based)
    scheduledWeekday: d.weekday != null && d.weekday >= 1 && d.weekday <= 7 ? d.weekday : null,
    durationMin: d.durationMin != null && d.durationMin > 0 ? Math.round(d.durationMin) : null,
    targetCalories: d.targetCalories != null && d.targetCalories > 0 ? Math.round(d.targetCalories) : null,
    exercises: {
      create: d.exercises.map((e, i) => ({
        exerciseId: exerciseIdByName.get(e.name.trim())!,
        sets: e.sets || 3,
        reps: e.reps.trim() || "10",
        // Il carico ha senso solo per le schede con pesi
        weight:
          planType === "WEIGHTS" && e.weight != null && !Number.isNaN(e.weight) ? e.weight : null,
        restSeconds: e.restSeconds || 60,
        notes: e.notes?.trim() || null,
        order: i,
      })),
    },
  }));
}

export async function createWorkoutPlan(input: CreatePlanInput): Promise<CreatePlanResult> {
  const trainer = await getTrainer();
  if (!trainer) return { ok: false, error: "Non autorizzato." };

  if (!input.name?.trim()) return { ok: false, error: "Dai un nome alla scheda." };

  const clientId = input.clientId?.trim() || null;
  const isTemplate = !clientId;
  const planType = input.planType ?? "WEIGHTS";

  if (clientId) {
    const client = await prisma.clientProfile.findFirst({ where: { id: clientId, trainerId: trainer.id } });
    if (!client) return { ok: false, error: "Cliente non valido." };
  }

  const workoutsCreate = await buildWorkoutsCreate(input.days, trainer.id, planType);
  if (!workoutsCreate) return { ok: false, error: "Aggiungi almeno un giorno con un esercizio." };

  if (clientId) {
    await prisma.workoutPlan.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    });
  }

  const { start, end } = computeDates(input.startDate, input.durationWeeks);

  const plan = await prisma.workoutPlan.create({
    data: {
      trainerId: trainer.id,
      clientId,
      isTemplate,
      isActive: !isTemplate,
      name: input.name.trim(),
      planType,
      description: input.description?.trim() || null,
      durationWeeks: input.durationWeeks ?? null,
      startDate: start,
      endDate: end,
      workouts: { create: workoutsCreate },
    },
  });

  revalidatePath("/trainer/workouts");
  if (clientId) revalidatePath(`/trainer/clients/${clientId}`);
  return { ok: true, planId: plan.id };
}

export async function updateWorkoutPlan(
  planId: string,
  input: CreatePlanInput
): Promise<CreatePlanResult> {
  const trainer = await getTrainer();
  if (!trainer) return { ok: false, error: "Non autorizzato." };

  const existing = await prisma.workoutPlan.findFirst({
    where: { id: planId, trainerId: trainer.id },
    include: { workouts: { select: { id: true } } },
  });
  if (!existing) return { ok: false, error: "Scheda non trovata." };

  if (!input.name?.trim()) return { ok: false, error: "Dai un nome alla scheda." };

  const clientId = input.clientId?.trim() || null;
  const isTemplate = !clientId;
  const planType = input.planType ?? "WEIGHTS";

  if (clientId) {
    const client = await prisma.clientProfile.findFirst({ where: { id: clientId, trainerId: trainer.id } });
    if (!client) return { ok: false, error: "Cliente non valido." };
  }

  const workoutsCreate = await buildWorkoutsCreate(input.days, trainer.id, planType);
  if (!workoutsCreate) return { ok: false, error: "Aggiungi almeno un giorno con un esercizio." };

  // Rimuovi i giorni precedenti (e le eventuali sessioni collegate)
  const oldDayIds = existing.workouts.map((w) => w.id);
  if (oldDayIds.length) {
    await prisma.workoutSession.deleteMany({ where: { workoutDayId: { in: oldDayIds } } });
    await prisma.workoutDay.deleteMany({ where: { planId } });
  }

  // Se assegnata a un cliente, disattiva le altre schede attive del cliente
  if (clientId) {
    await prisma.workoutPlan.updateMany({
      where: { clientId, isActive: true, id: { not: planId } },
      data: { isActive: false },
    });
  }

  await prisma.workoutPlan.update({
    where: { id: planId },
    data: {
      clientId,
      isTemplate,
      isActive: !isTemplate,
      name: input.name.trim(),
      planType,
      description: input.description?.trim() || null,
      durationWeeks: input.durationWeeks ?? null,
      startDate: computeDates(input.startDate, input.durationWeeks).start,
      endDate: computeDates(input.startDate, input.durationWeeks).end,
      workouts: { create: workoutsCreate },
    },
  });

  revalidatePath("/trainer/workouts");
  revalidatePath(`/trainer/workouts/${planId}`);
  if (clientId) revalidatePath(`/trainer/clients/${clientId}`);
  // Se la scheda è stata scollegata (nessun cliente) o spostata su un altro cliente,
  // va invalidato anche il profilo del cliente PRECEDENTE: senza questo continua a
  // mostrarla dalla cache (in particolare tornando indietro col browser).
  if (existing.clientId && existing.clientId !== clientId) {
    revalidatePath(`/trainer/clients/${existing.clientId}`);
  }
  return { ok: true, planId };
}

export async function deleteWorkoutPlan(planId: string): Promise<{ ok: boolean; error?: string }> {
  const trainer = await getTrainer();
  if (!trainer) return { ok: false, error: "Non autorizzato." };

  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, trainerId: trainer.id },
    include: { workouts: { select: { id: true } } },
  });
  if (!plan) return { ok: false, error: "Scheda non trovata." };

  const dayIds = plan.workouts.map((w) => w.id);
  if (dayIds.length) {
    await prisma.workoutSession.deleteMany({ where: { workoutDayId: { in: dayIds } } });
  }
  await prisma.workoutPlan.delete({ where: { id: planId } });

  revalidatePath("/trainer/workouts");
  if (plan.clientId) revalidatePath(`/trainer/clients/${plan.clientId}`);
  return { ok: true };
}

// Assegna una scheda esistente (es. un modello) a un cliente, creando una COPIA
// così il modello originale resta intatto e riutilizzabile.
export async function assignTemplateToClient(
  planId: string,
  clientId: string
): Promise<CreatePlanResult> {
  const trainer = await getTrainer();
  if (!trainer) return { ok: false, error: "Non autorizzato." };
  if (!clientId) return { ok: false, error: "Seleziona un cliente." };

  const client = await prisma.clientProfile.findFirst({
    where: { id: clientId, trainerId: trainer.id },
  });
  if (!client) return { ok: false, error: "Cliente non valido." };

  const source = await prisma.workoutPlan.findFirst({
    where: { id: planId, trainerId: trainer.id },
    include: {
      workouts: {
        orderBy: { dayOfWeek: "asc" },
        include: { exercises: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!source) return { ok: false, error: "Scheda non trovata." };

  // Disattiva le altre schede attive del cliente
  await prisma.workoutPlan.updateMany({
    where: { clientId, isActive: true },
    data: { isActive: false },
  });

  const newPlan = await prisma.workoutPlan.create({
    data: {
      trainerId: trainer.id,
      clientId,
      isTemplate: false,
      isActive: true,
      name: source.name,
      planType: source.planType,
      description: source.description,
      durationWeeks: source.durationWeeks,
      startDate: computeDates(null, source.durationWeeks).start,
      endDate: computeDates(null, source.durationWeeks).end,
      workouts: {
        create: source.workouts.map((w) => ({
          name: w.name,
          dayOfWeek: w.dayOfWeek,
          scheduledWeekday: w.scheduledWeekday,
          durationMin: w.durationMin,
          targetCalories: w.targetCalories,
          exercises: {
            create: w.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              sets: e.sets,
              reps: e.reps,
              weight: e.weight,
              restSeconds: e.restSeconds,
              notes: e.notes,
              order: e.order,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/trainer/workouts");
  revalidatePath(`/trainer/clients/${clientId}`);
  return { ok: true, planId: newPlan.id };
}
