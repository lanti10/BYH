import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "CLIENT" || !me.clientProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { workoutDayId, durationSec, calories, avgHeartRate, maxHeartRate, rating, notes } = body;

  if (!workoutDayId) {
    return NextResponse.json({ error: "Missing workoutDayId" }, { status: 400 });
  }

  // Verifica che il giorno appartenga a una scheda del cliente
  const day = await prisma.workoutDay.findFirst({
    where: { id: workoutDayId, plan: { clientId: me.clientProfile.id } },
    select: { id: true },
  });
  if (!day) return NextResponse.json({ error: "Giorno non valido" }, { status: 403 });

  const sec = Number(durationSec) || 0;

  const session = await prisma.workoutSession.create({
    data: {
      clientId: me.clientProfile.id,
      workoutDayId,
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
