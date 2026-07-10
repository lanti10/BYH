import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ count: 0 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ count: 0 });

  // `?with=<userId>` → non letti solo da quel mittente; altrimenti totale.
  const withId = new URL(req.url).searchParams.get("with");

  const count = await prisma.message.count({
    where: { receiverId: user.id, readAt: null, ...(withId ? { senderId: withId } : {}) },
  });
  return NextResponse.json({ count });
}
