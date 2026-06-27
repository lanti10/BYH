"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ProfileInput = {
  sex: string;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  goals: string[];
  trainingDaysPerWeek?: number | null;
  notes?: string;
};

export async function completeClientProfile(
  input: ProfileInput
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

  return { ok: true };
}
