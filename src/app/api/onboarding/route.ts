import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role } = await req.json();
  if (role !== "TRAINER" && role !== "CLIENT") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Leggi i dati reali da Clerk così l'utente è completo senza dipendere dal webhook
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";
  const name = `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim();
  const avatarUrl = clerkUser?.imageUrl ?? null;

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { role, email, name, avatarUrl },
    create: {
      clerkId: userId,
      email,
      name,
      avatarUrl,
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
