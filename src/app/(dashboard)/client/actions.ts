"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";
import { buildWorkoutsCreate, computeDates } from "@/lib/workout-create";
import type { CreatePlanInput, CreatePlanResult } from "@/lib/workout-create";

// Il cliente registra il proprio peso attuale (crea un ProgressLog).
export async function logWeight(weight: number): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.clientProfile) {
    return { ok: false, error: "Non autorizzato." };
  }
  if (!Number.isFinite(weight) || weight <= 0 || weight > 500) {
    return { ok: false, error: "Peso non valido." };
  }
  await prisma.progressLog.create({
    data: { clientId: user.clientProfile.id, weight },
  });
  revalidatePath("/client");
  revalidatePath("/client/progress");
  return { ok: true };
}

// Il cliente si crea la propria scheda in autonomia (vale per tutti i clienti,
// anche per chi ha un personal trainer). La scheda resta legata al suo PT,
// così il trainer continua a vederla tra le schede del cliente.
export async function createOwnWorkoutPlan(input: CreatePlanInput): Promise<CreatePlanResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.clientProfile) {
    return { ok: false, error: "Non autorizzato." };
  }
  if (!input.name?.trim()) return { ok: false, error: "Dai un nome alla scheda." };

  const clientId = user.clientProfile.id;
  const trainerId = user.clientProfile.trainerId;
  const planType = input.planType ?? "WEIGHTS";

  const workoutsCreate = await buildWorkoutsCreate(input.days, trainerId, planType);
  if (!workoutsCreate) return { ok: false, error: "Aggiungi almeno un giorno con un esercizio." };

  // La scheda del trainer NON va scavalcata: se ce n'è una attiva assegnata da lui,
  // la nuova resta in attesa di approvazione. Se non c'è (o l'attiva se l'era fatta
  // il cliente stesso) parte subito attiva.
  const active = await prisma.workoutPlan.findFirst({
    where: { clientId, isActive: true },
    select: { id: true, createdByClient: true },
  });
  const needsApproval = !!active && !active.createdByClient;

  if (!needsApproval && active) {
    await prisma.workoutPlan.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    });
  }

  const { start, end } = computeDates(input.startDate, input.durationWeeks);

  const plan = await prisma.workoutPlan.create({
    data: {
      trainerId,
      clientId,
      isTemplate: false,
      isActive: !needsApproval,
      createdByClient: true,
      pendingApproval: needsApproval,
      name: input.name.trim(),
      planType,
      description: input.description?.trim() || null,
      durationWeeks: input.durationWeeks ?? null,
      startDate: start,
      endDate: end,
      workouts: { create: workoutsCreate },
    },
  });

  // Avvisa il trainer: messaggio in chat che porta alla pagina di approvazione
  if (needsApproval) {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      select: { userId: true },
    });
    if (trainer) {
      await prisma.message.create({
        data: {
          senderId: user.id,
          receiverId: trainer.userId,
          type: "PLAN_APPROVAL",
          content: plan.name,
          planId: plan.id,
        },
      });
      try {
        await sendPushToUser(trainer.userId, {
          title: user.name || "BYH",
          body: `Ha creato una scheda da approvare: ${plan.name}`,
          icon: user.avatarUrl || "/icon-192.png",
          url: `/trainer/clients/${clientId}`,
          tag: `plan-approval-${plan.id}`,
        });
      } catch {
        /* la push è best-effort */
      }
    }
    revalidatePath(`/trainer/clients/${clientId}`);
  }

  revalidatePath("/client");
  revalidatePath("/client/workout");
  return { ok: true, planId: plan.id };
}
