import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role } = await req.json();
  if (role !== "TRAINER" && role !== "CLIENT") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { role },
    create: {
      clerkId: userId,
      email: "",
      name: "",
      role,
    },
  });

  if (role === "TRAINER") {
    await prisma.trainerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  return NextResponse.json({ ok: true });
}
