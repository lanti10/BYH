// Logica condivisa per la creazione di una scheda.
// Usata dal trainer (per i clienti e per sé) e dal cliente che si crea la
// scheda da solo. Modulo puro: niente "use server", così può essere importato
// da entrambe le parti senza diventare una server action.
import { prisma } from "@/lib/prisma";
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
  durationMin?: number | null; // durata allenamento in minuti; null = usa la stima
  targetCalories?: number | null; // calorie da bruciare; null = obiettivo di default
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

export type CreatePlanResult = { ok: boolean; error?: string; planId?: string };

// Calcola inizio e fine dalla data di partenza + durata in settimane
export function computeDates(startDate?: string | null, durationWeeks?: number | null) {
  const start = startDate ? new Date(startDate) : new Date();
  const end =
    durationWeeks && durationWeeks > 0
      ? new Date(start.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000)
      : null;
  return { start, end };
}

// Pulisce i giorni vuoti e mappa i nomi degli esercizi a id (find-or-create)
export async function buildWorkoutsCreate(
  days: DayInput[],
  trainerId: string,
  planType: PlanType,
) {
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
    targetCalories:
      d.targetCalories != null && d.targetCalories > 0 ? Math.round(d.targetCalories) : null,
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
