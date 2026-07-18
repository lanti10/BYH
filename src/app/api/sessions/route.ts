import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  return NextResponse.json({ ok: true, id: session.id });
}
