import { prisma } from "@/lib/prisma";
import type { PlanType } from "@prisma/client";

// Struttura scheda accettata dall'agente esterno (stesso contratto del builder)
export type AgentExercise = {
  name: string;
  sets?: number;
  reps?: string;
  weight?: number | null;
  restSeconds?: number;
  notes?: string | null;
};
export type AgentDay = {
  name?: string;
  weekday?: number | null;
  exercises: AgentExercise[];
};
export type AgentPlanInput = {
  trainerEmail: string;
  clientEmail?: string | null;
  planType?: PlanType;
  name: string;
  description?: string | null;
  durationWeeks?: number | null;
  startDate?: string | null; // "yyyy-mm-dd"
  days: AgentDay[];
};

export type AgentPlanResult =
  | { ok: true; planId: string }
  | { ok: false; status: number; error: string };

function computeDates(startDate?: string | null, durationWeeks?: number | null) {
  const start = startDate ? new Date(startDate) : new Date();
  const end =
    durationWeeks && durationWeeks > 0
      ? new Date(start.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000)
      : null;
  return { start, end };
}

// Crea una scheda per il trainer indicato (per email). Riusa la stessa logica del
// builder: find-or-create degli esercizi per nome, giorni con weekday, note, ecc.
export async function createPlanFromAgent(input: AgentPlanInput): Promise<AgentPlanResult> {
  const trainerEmail = input.trainerEmail?.trim().toLowerCase();
  if (!trainerEmail) return { ok: false, status: 400, error: "trainerEmail obbligatorio." };
  if (!input.name?.trim()) return { ok: false, status: 400, error: "name obbligatorio." };
  if (!Array.isArray(input.days) || input.days.length === 0)
    return { ok: false, status: 400, error: "days: serve almeno un giorno." };

  const trainerUser = await prisma.user.findFirst({
    where: { email: { equals: trainerEmail, mode: "insensitive" }, role: "TRAINER" },
    include: { trainerProfile: true },
  });
  if (!trainerUser?.trainerProfile)
    return { ok: false, status: 404, error: `Nessun trainer con email ${trainerEmail}.` };
  const trainer = trainerUser.trainerProfile;

  // Cliente opzionale (deve appartenere al trainer)
  let clientId: string | null = null;
  if (input.clientEmail?.trim()) {
    const clientEmail = input.clientEmail.trim().toLowerCase();
    const clientProfile = await prisma.clientProfile.findFirst({
      where: {
        trainerId: trainer.id,
        user: { email: { equals: clientEmail, mode: "insensitive" } },
      },
    });
    if (!clientProfile)
      return { ok: false, status: 404, error: `Nessun cliente ${clientEmail} collegato a questo trainer.` };
    clientId = clientProfile.id;
  }

  const planType: PlanType = input.planType ?? "WEIGHTS";
  const usesWeight = planType === "WEIGHTS";
  const defaultCategory = planType === "SWIMMING" ? "CARDIO" : "STRENGTH";

  // Pulisci i giorni e mappa gli esercizi a id (find-or-create)
  const validDays = input.days
    .map((d) => ({ ...d, exercises: (d.exercises ?? []).filter((e) => e.name?.trim()) }))
    .filter((d) => d.exercises.length > 0);
  if (validDays.length === 0)
    return { ok: false, status: 400, error: "Nessun esercizio valido nei giorni forniti." };

  const uniqueNames = [...new Set(validDays.flatMap((d) => d.exercises.map((e) => e.name.trim())))];
  const exerciseIdByName = new Map<string, string>();
  for (const name of uniqueNames) {
    const existing = await prisma.exercise.findFirst({ where: { name } });
    if (existing) {
      exerciseIdByName.set(name, existing.id);
    } else {
      const created = await prisma.exercise.create({
        data: { name, category: defaultCategory, isCustom: true, createdBy: trainer.id },
      });
      exerciseIdByName.set(name, created.id);
    }
  }

  const workoutsCreate = validDays.map((d, dayIndex) => ({
    name: d.name?.trim() || `Giorno ${dayIndex + 1}`,
    dayOfWeek: dayIndex,
    scheduledWeekday: d.weekday != null && d.weekday >= 1 && d.weekday <= 7 ? d.weekday : null,
    exercises: {
      create: d.exercises.map((e, i) => ({
        exerciseId: exerciseIdByName.get(e.name.trim())!,
        sets: e.sets && e.sets > 0 ? Math.round(e.sets) : 3,
        reps: e.reps?.toString().trim() || "10",
        weight: usesWeight && typeof e.weight === "number" && !Number.isNaN(e.weight) ? e.weight : null,
        restSeconds: e.restSeconds && e.restSeconds >= 0 ? Math.round(e.restSeconds) : 60,
        notes: e.notes?.toString().trim() || null,
        order: i,
      })),
    },
  }));

  const isTemplate = !clientId;
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

  return { ok: true, planId: plan.id };
}
