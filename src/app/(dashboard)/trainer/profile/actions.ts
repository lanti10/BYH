"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Allinea l'email nel DB dopo un cambio email su Clerk (così resta coerente
// con chat, API agente, ecc. che cercano l'utente per email).
export async function syncMyEmail(email: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false };
  await prisma.user.update({ where: { id: user.id }, data: { email: clean } });
  revalidatePath("/trainer/profile");
  return { ok: true };
}
