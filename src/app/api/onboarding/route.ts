import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateUniqueReferralCode } from "@/lib/referral";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, referralCode } = await req.json();
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
    create: { clerkId: userId, email, name, avatarUrl, role },
  });

  if (role === "TRAINER") {
    const existing = await prisma.trainerProfile.findUnique({ where: { userId: user.id } });
    if (!existing) {
      await prisma.trainerProfile.create({
        data: { userId: user.id, referralCode: await generateUniqueReferralCode() },
      });
    }
    return NextResponse.json({ ok: true, redirect: "/trainer" });
  }

  // role === CLIENT — collega al trainer tramite codice referral (body o cookie d'invito)
  const cookieStore = await cookies();
  const code = (referralCode || cookieStore.get("byh_ref")?.value || "")
    .toString()
    .trim()
    .toUpperCase();

  if (code) {
    const trainer = await prisma.trainerProfile.findUnique({ where: { referralCode: code } });
    if (!trainer) {
      return NextResponse.json(
        { error: "Codice non valido. Controlla il codice del tuo trainer." },
        { status: 400 }
      );
    }
    await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: { trainerId: trainer.id },
      create: { userId: user.id, trainerId: trainer.id },
    });
    cookieStore.delete("byh_ref");
    return NextResponse.json({ ok: true, redirect: "/client" });
  }

  // Nessun codice: l'utente è cliente ma non ancora collegato a un trainer
  return NextResponse.json({ ok: true, redirect: "/client" });
}
