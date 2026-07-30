"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleSuspended(userId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireRole("ADMIN");
  if (admin.id === userId) return { ok: false, error: "self" };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { suspended: true } });
  if (!target) return { ok: false, error: "not_found" };

  await prisma.user.update({ where: { id: userId }, data: { suspended: !target.suspended } });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function moveClientToTrainer(
  clientProfileId: string,
  newTrainerId: string
): Promise<{ ok: boolean }> {
  await requireRole("ADMIN");
  await prisma.clientProfile.update({ where: { id: clientProfileId }, data: { trainerId: newTrainerId } });
  revalidatePath("/admin/users");
  return { ok: true };
}
