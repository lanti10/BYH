"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { buildWorkoutsCreate, computeDates } from "@/lib/workout-create";

// Tipi e helper vivono in @/lib/workout-create, condivisi col cliente che si
// crea la scheda da solo. Ri-esportati qui per non rompere gli import esistenti.
export type {
  ExerciseInput,
  DayInput,
  CreatePlanInput,
  CreatePlanResult,
} from "@/lib/workout-create";

import type { CreatePlanInput, CreatePlanResult } from "@/lib/workout-create";

async function getTrainer() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TRAINER" || !user.trainerProfile) return null;
  return user.trainerProfile;
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
    select: { id: true, clientId: true },
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

  const { start, end } = computeDates(input.startDate, input.durationWeeks);

  // Ricostruzione in-place: si eliminano i vecchi giorni e si ricreano.
  // Le sessioni e i pesi registrati NON vengono mai cancellati: sono sganciati
  // (SetNull) e portano uno snapshot, quindi restano nello storico anche dopo
  // la modifica. Nessuna scheda-doppione.
  await prisma.workoutDay.deleteMany({ where: { planId } });

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
      startDate: start,
      endDate: end,
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
    select: { id: true, clientId: true },
  });
  if (!plan) return { ok: false, error: "Scheda non trovata." };

  // Elimina la scheda (i giorni cascadeano). Le sessioni e i pesi del cliente NON
  // vengono cancellati: si sganciano (SetNull) e restano nello storico grazie allo
  // snapshot. Eliminare una scheda toglie la scheda, non la storia di chi si è allenato.
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

// ─── Approvazione delle schede create dal cliente ────────────────────────────
// Il cliente può crearsi una scheda, ma non scavalca quella del trainer:
// resta in attesa finché il trainer non la approva da qui.

export async function approveClientPlan(planId: string): Promise<{ ok: boolean; error?: string }> {
  const trainer = await getTrainer();
  if (!trainer) return { ok: false, error: "Non autorizzato." };

  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, trainerId: trainer.id, pendingApproval: true },
    select: { id: true, clientId: true },
  });
  if (!plan || !plan.clientId) return { ok: false, error: "Scheda non trovata." };

  // Diventa la scheda attiva: disattiva le precedenti
  await prisma.workoutPlan.updateMany({
    where: { clientId: plan.clientId, isActive: true },
    data: { isActive: false },
  });
  await prisma.workoutPlan.update({
    where: { id: plan.id },
    data: { isActive: true, pendingApproval: false },
  });

  revalidatePath(`/trainer/clients/${plan.clientId}`);
  revalidatePath("/trainer/workouts");
  return { ok: true };
}

export async function rejectClientPlan(planId: string): Promise<{ ok: boolean; error?: string }> {
  const trainer = await getTrainer();
  if (!trainer) return { ok: false, error: "Non autorizzato." };

  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, trainerId: trainer.id, pendingApproval: true },
    select: { id: true, clientId: true },
  });
  if (!plan) return { ok: false, error: "Scheda non trovata." };

  // Non la cancello: resta salvata come scheda non attiva, solo non più in attesa
  await prisma.workoutPlan.update({
    where: { id: plan.id },
    data: { pendingApproval: false, isActive: false },
  });

  revalidatePath(`/trainer/clients/${plan.clientId}`);
  revalidatePath("/trainer/workouts");
  return { ok: true };
}
