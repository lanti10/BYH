"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProfileInput = {
  sex: string;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  goals: string[];
  trainingDaysPerWeek?: number | null;
  notes?: string;
};

// `redirectTo`: al PRIMO setup il cliente deve atterrare sulla dashboard.
// Il redirect si fa QUI, lato server, subito dopo la scrittura: farlo dal client
// (router.push + router.refresh) non funzionava — il refresh ricarica la rotta
// corrente e annullava la navigazione, lasciando l'utente fermo sul form.
export async function completeClientProfile(
  input: ProfileInput,
  redirectTo?: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT" || !user.clientProfile) {
    return { ok: false, error: "Non autorizzato." };
  }

  const birthDate =
    input.age && input.age > 0 ? new Date(new Date().getFullYear() - input.age, 0, 1) : null;

  await prisma.clientProfile.update({
    where: { id: user.clientProfile.id },
    data: {
      sex: input.sex || null,
      birthDate,
      height: input.height ?? null,
      startWeight: input.weight ?? null,
      goals: input.goals,
      trainingDaysPerWeek: input.trainingDaysPerWeek ?? null,
      notes: input.notes?.trim() || null,
      profileCompleted: true,
    },
  });

  revalidatePath("/client");
  revalidatePath("/profile-setup");
  if (redirectTo) redirect(redirectTo);

  return { ok: true };
}
