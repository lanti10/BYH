import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Attività per la lista clienti del trainer (aggiornamento in tempo reale):
// per ogni cliente → timestamp dell'ultimo messaggio (per l'ordine WhatsApp) +
// numero di messaggi non letti (per il pallino sulla riga).
export async function GET() {
  const me = await getCurrentUser();
  if (!me || me.role !== "TRAINER" || !me.trainerProfile) {
    return NextResponse.json({ activity: [] });
  }

  const clients = await prisma.clientProfile.findMany({
    where: { trainerId: me.trainerProfile.id },
    select: { userId: true },
  });
  const ids = clients.map((c) => c.userId);
  if (ids.length === 0) return NextResponse.json({ activity: [] });

  const convo = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me.id, receiverId: { in: ids } },
        { senderId: { in: ids }, receiverId: me.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { senderId: true, receiverId: true, createdAt: true },
  });
  const lastAt = new Map<string, number>();
  for (const m of convo) {
    const other = m.senderId === me.id ? m.receiverId : m.senderId;
    if (!lastAt.has(other)) lastAt.set(other, m.createdAt.getTime());
  }

  const unreadRows = await prisma.message.groupBy({
    by: ["senderId"],
    where: { receiverId: me.id, readAt: null, senderId: { in: ids } },
    _count: true,
  });
  const unread = new Map(unreadRows.map((r) => [r.senderId, r._count]));

  return NextResponse.json({
    activity: ids.map((userId) => ({
      userId,
      lastAt: lastAt.get(userId) ?? null,
      unread: unread.get(userId) ?? 0,
    })),
  });
}
