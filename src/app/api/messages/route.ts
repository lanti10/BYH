import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Me = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// Verifica che i due utenti siano collegati (trainer ↔ proprio cliente)
async function canMessage(me: Me, otherUserId: string): Promise<boolean> {
  if (me.role === "TRAINER" && me.trainerProfile) {
    const c = await prisma.clientProfile.findFirst({
      where: { userId: otherUserId, trainerId: me.trainerProfile.id },
    });
    return !!c;
  }
  if (me.role === "CLIENT" && me.clientProfile) {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: me.clientProfile.trainerId },
      select: { userId: true },
    });
    return trainer?.userId === otherUserId;
  }
  return false;
}

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const withId = new URL(req.url).searchParams.get("with");
  if (!withId) return NextResponse.json({ error: "Missing 'with'" }, { status: 400 });
  if (!(await canMessage(me, withId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me.id, receiverId: withId },
        { senderId: withId, receiverId: me.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 300,
  });

  // Segna come letti i messaggi ricevuti
  await prisma.message.updateMany({
    where: { senderId: withId, receiverId: me.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    meId: me.id,
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, content } = await req.json();
  if (!receiverId || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!(await canMessage(me, receiverId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const msg = await prisma.message.create({
    data: { senderId: me.id, receiverId, content: content.trim() },
  });

  return NextResponse.json({
    id: msg.id,
    senderId: msg.senderId,
    content: msg.content,
    createdAt: msg.createdAt,
  });
}
