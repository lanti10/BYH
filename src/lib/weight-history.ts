import { prisma } from "@/lib/prisma";
import type { WeightEntry } from "@/components/shared/exercise-weight-editor";

// Storico pesi del cliente per gli esercizi indicati, indicizzato per NOME esercizio.
// Chiave per nome (non per id) così i carichi seguono l'esercizio anche quando la
// scheda viene modificata e gli id degli esercizi cambiano.
export async function loadWeightHistory(
  clientId: string,
  exerciseNames: string[]
): Promise<Record<string, WeightEntry[]>> {
  const names = [...new Set(exerciseNames.filter(Boolean))];
  if (names.length === 0) return {};

  const logs = await prisma.exerciseWeightLog.findMany({
    where: { clientId, exerciseName: { in: names } },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: { exerciseName: true, weight: true, createdAt: true },
  });

  const map: Record<string, WeightEntry[]> = {};
  for (const l of logs) {
    if (!l.exerciseName) continue;
    (map[l.exerciseName] ??= []).push({ weight: l.weight, date: l.createdAt.toISOString() });
  }
  return map;
}
