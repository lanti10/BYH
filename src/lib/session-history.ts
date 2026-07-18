import type { PlanType } from "@prisma/client";
import type { HistSession } from "@/components/shared/session-history";

// Forma della sessione così come arriva da Prisma per lo storico: metriche +
// snapshot autonomo + (se ancora esiste) il giorno di scheda collegato.
type SnapshotExercise = {
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  restSeconds: number;
  notes?: string | null;
};
type Snapshot = { dayName?: string; planType?: PlanType; exercises?: SnapshotExercise[] };

export type SessionRow = {
  id: string;
  completedAt: Date;
  durationMin: number | null;
  calories: number | null;
  avgHeartRate: number | null;
  snapshot: unknown;
  workoutDay: {
    name: string;
    plan: { planType: PlanType } | null;
    exercises: {
      sets: number;
      reps: string;
      weight: number | null;
      restSeconds: number;
      notes: string | null;
      exercise: { name: string };
    }[];
  } | null;
};

// Mappa una sessione in HistSession, preferendo lo snapshot (autonomo, sopravvive a
// modifica/eliminazione della scheda) e usando il giorno collegato solo come fallback.
export function toHistSession(s: SessionRow): HistSession {
  const snap = (s.snapshot ?? null) as Snapshot | null;
  const fromDay = s.workoutDay;

  const exercises =
    snap?.exercises && snap.exercises.length > 0
      ? snap.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          restSeconds: e.restSeconds,
          notes: e.notes ?? null,
        }))
      : (fromDay?.exercises ?? []).map((e) => ({
          name: e.exercise.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          restSeconds: e.restSeconds,
          notes: e.notes,
        }));

  return {
    id: s.id,
    date: s.completedAt.toISOString(),
    name: snap?.dayName ?? fromDay?.name ?? "",
    min: s.durationMin ?? 0,
    cal: s.calories ?? 0,
    hr: s.avgHeartRate ?? null,
    planType: snap?.planType ?? fromDay?.plan?.planType ?? "WEIGHTS",
    exercises,
  };
}

// Include Prisma da usare nelle query dello storico (snapshot + giorno di fallback).
export const sessionHistoryInclude = {
  workoutDay: {
    include: {
      plan: { select: { planType: true } },
      exercises: {
        orderBy: { order: "asc" as const },
        include: { exercise: { select: { name: true } } },
      },
    },
  },
} as const;
