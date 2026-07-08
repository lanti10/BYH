"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Il cliente registra il proprio peso attuale (crea un ProgressLog).
export async function logWeight(weight: number): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.clientProfile) {
    return { ok: false, error: "Non autorizzato." };
  }
  if (!Number.isFinite(weight) || weight <= 0 || weight > 500) {
    return { ok: false, error: "Peso non valido." };
  }
  await prisma.progressLog.create({
    data: { clientId: user.clientProfile.id, weight },
  });
  revalidatePath("/client");
  revalidatePath("/client/progress");
  return { ok: true };
}
