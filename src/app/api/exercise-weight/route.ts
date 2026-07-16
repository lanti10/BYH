import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Il cliente registra il peso che usa davvero su un esercizio della SUA scheda.
// Scrive una riga di storico: la prescrizione del trainer (WorkoutExercise.weight)
// non viene mai sovrascritta.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  // Chiunque abbia un clientProfile: clienti veri e PT che si allena (auto-cliente).
  if (!me?.clientProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workoutExerciseId, weight } = await req.json();
  if (!workoutExerciseId || typeof workoutExerciseId !== "string") {
    return NextResponse.json({ error: "Missing workoutExerciseId" }, { status: 400 });
  }

  const w = Number(weight);
  if (!Number.isFinite(w) || w < 0 || w > 1000) {
    return NextResponse.json({ error: "Peso non valido" }, { status: 400 });
  }

  // L'esercizio deve appartenere a una scheda di questo cliente
  const owned = await prisma.workoutExercise.findFirst({
    where: { id: workoutExerciseId, workoutDay: { plan: { clientId: me.clientProfile.id } } },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Esercizio non valido" }, { status: 403 });

  const log = await prisma.exerciseWeightLog.create({
    data: {
      clientId: me.clientProfile.id,
      workoutExerciseId,
      weight: Math.round(w * 100) / 100,
    },
    select: { weight: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, weight: log.weight, date: log.createdAt.toISOString() });
}
