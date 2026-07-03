import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Notifiche = messaggi non letti (in futuro: schede assegnate, medaglie, ecc.)
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ items: [], count: 0 });

  const unread = await prisma.message.findMany({
    where: { receiverId: me.id, readAt: null },
    include: { sender: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    count: unread.length,
    items: unread.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.name || m.sender.email,
      preview: m.content.length > 70 ? m.content.slice(0, 70) + "…" : m.content,
      createdAt: m.createdAt,
    })),
  });
}

// Segna tutte come lette
export async function POST() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.message.updateMany({
    where: { receiverId: me.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
