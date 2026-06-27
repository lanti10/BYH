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

  const cookieStore = await cookies();

  if (role === "TRAINER") {
    const existing = await prisma.trainerProfile.findUnique({ where: { userId: user.id } });
    if (!existing) {
      // MLM: se invitato da un altro trainer, collega la rete
      const trainerRefCode = (cookieStore.get("byh_ref_trainer")?.value || "")
        .toString()
        .trim()
        .toUpperCase();
      let referredById: string | undefined;
      let referralLevel = 0;
      if (trainerRefCode) {
        const inviter = await prisma.trainerProfile.findUnique({
          where: { referralCode: trainerRefCode },
        });
        if (inviter) {
          referredById = inviter.id;
          referralLevel = inviter.referralLevel + 1;
        }
      }
      await prisma.trainerProfile.create({
        data: {
          userId: user.id,
          referralCode: await generateUniqueReferralCode(),
          referredById,
          referralLevel,
        },
      });
      cookieStore.delete("byh_ref_trainer");
    }
    return NextResponse.json({ ok: true, redirect: "/trainer" });
  }

  // role === CLIENT — collega al trainer tramite codice referral (body o cookie d'invito)
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
