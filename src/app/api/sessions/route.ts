import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMedals } from "@/lib/medals";
import { getStreak } from "@/lib/workout";
import { NextResponse } from "next/server";

/**
 * Nuovo massimale segnato in questo allenamento: per ogni esercizio del giorno
 * confronta il carico registrato oggi con il massimo di tutte le volte precedenti.
 * Restituisce il salto più significativo, o null se oggi non si è battuto nulla.
 */
async function findNewRecord(clientId: string, exerciseNames: string[], completedAt: Date) {
  const names = [...new Set(exerciseNames.filter(Boolean))];
  if (names.length === 0) return null;

  const logs = await prisma.exerciseWeightLog.findMany({
    where: { clientId, exerciseName: { in: names } },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: { exerciseName: true, weight: true, createdAt: true },
  });

  // "Oggi" = registrato entro le 6 ore precedenti la fine dell'allenamento: i carichi
  // si annotano durante la sessione, non dopo.
  const cutoff = new Date(completedAt.getTime() - 6 * 60 * 60 * 1000);

  let best: { exercise: string; weight: number; delta: number; previous: number } | null = null;
  for (const name of names) {
    const forEx = logs.filter((l) => l.exerciseName === name);
    const today = forEx.filter((l) => l.createdAt >= cutoff);
    const older = forEx.filter((l) => l.createdAt < cutoff);
    if (today.length === 0 || older.length === 0) continue; // senza storico non è un record

    const todayMax = Math.max(...today.map((l) => l.weight));
    const prevMax = Math.max(...older.map((l) => l.weight));
    if (todayMax <= prevMax) continue;

    const delta = Math.round((todayMax - prevMax) * 10) / 10;
    if (!best || delta > best.delta) best = { exercise: name, weight: todayMax, delta, previous: prevMax };
  }
  return best;
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  // Chiunque abbia un clientProfile può salvare sessioni per le PROPRIE schede:
  // sia i clienti veri, sia il PT che si allena (auto-cliente). Il controllo di
  // proprietà del giorno qui sotto garantisce che sia roba sua.
  if (!me || !me.clientProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { workoutDayId, durationSec, calories, avgHeartRate, maxHeartRate, rating, notes } = body;

  if (!workoutDayId) {
    return NextResponse.json({ error: "Missing workoutDayId" }, { status: 400 });
  }

  // Verifica che il giorno appartenga a una scheda del cliente + dati per lo snapshot
  const day = await prisma.workoutDay.findFirst({
    where: { id: workoutDayId, plan: { clientId: me.clientProfile.id } },
    select: {
      id: true,
      name: true,
      plan: { select: { planType: true } },
      exercises: {
        orderBy: { order: "asc" },
        select: {
          sets: true, reps: true, weight: true, restSeconds: true, notes: true,
          exercise: { select: { name: true } },
        },
      },
    },
  });
  if (!day) return NextResponse.json({ error: "Giorno non valido" }, { status: 403 });

  const sec = Number(durationSec) || 0;

  // Snapshot dell'allenamento: rende la sessione autonoma dalla scheda, così lo
  // storico sopravvive se la scheda viene poi modificata o eliminata.
  const snapshot = {
    dayName: day.name,
    planType: day.plan.planType,
    exercises: day.exercises.map((e) => ({
      name: e.exercise.name,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      restSeconds: e.restSeconds,
      notes: e.notes,
    })),
  };

  // Medaglie PRIMA di registrare: il confronto col dopo dice se questa sessione
  // ne ha sbloccata una, che è ciò che rende la card da condividere una notizia.
  const weeklyGoal = me.clientProfile.trainingDaysPerWeek ?? 3;
  const before = await prisma.workoutSession.findMany({
    where: { clientId: me.clientProfile.id },
    orderBy: { completedAt: "desc" },
    take: 400,
    select: { completedAt: true },
  });
  const unlockedBefore = new Set(
    computeMedals(before, weeklyGoal)
      .filter((m) => m.unlocked)
      .map((m) => m.id)
  );

  const session = await prisma.workoutSession.create({
    data: {
      clientId: me.clientProfile.id,
      workoutDayId,
      snapshot,
      durationSec: sec,
      durationMin: Math.round(sec / 60),
      calories: calories != null ? Math.round(Number(calories)) : null,
      avgHeartRate: avgHeartRate != null ? Math.round(Number(avgHeartRate)) : null,
      maxHeartRate: maxHeartRate != null ? Math.round(Number(maxHeartRate)) : null,
      rating: rating ?? null,
      notes: notes ?? null,
    },
  });

  // Riepilogo per la card da condividere a fine allenamento.
  const after = [{ completedAt: session.completedAt }, ...before];
  const newMedal = computeMedals(after, weeklyGoal).find((m) => m.unlocked && !unlockedBefore.has(m.id)) ?? null;

  // Massimale battuto oggi: fra i carichi registrati durante questo allenamento,
  // cerchiamo quello che supera il record storico dello stesso esercizio.
  const record = await findNewRecord(
    me.clientProfile.id,
    day.exercises.map((e) => e.exercise.name),
    session.completedAt
  );

  return NextResponse.json({
    ok: true,
    id: session.id,
    summary: {
      dayName: day.name,
      streakDays: getStreak(after),
      totalSessions: after.length,
      durationMin: Math.round(sec / 60),
      exerciseCount: day.exercises.length,
      calories: session.calories ?? 0,
      medal: newMedal
        ? { id: newMedal.id, icon: newMedal.icon, color: newMedal.color, title: newMedal.title, target: newMedal.target }
        : null,
      record,
    },
  });
}
