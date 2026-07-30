"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Cambia chi ha invitato un trainer. Il livello non è calcolato al volo (è un
// campo salvato), quindi va ricalcolato per il trainer spostato e a cascata
// per tutto il suo ramo esistente.
export async function reassignUpline(
  trainerId: string,
  newParentId: string | null
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("ADMIN");

  if (trainerId === newParentId) {
    return { ok: false, error: "self" };
  }

  let newLevel = 0;
  if (newParentId) {
    const newParent = await prisma.trainerProfile.findUnique({
      where: { id: newParentId },
      select: { referralLevel: true },
    });
    if (!newParent) return { ok: false, error: "not_found" };
    newLevel = newParent.referralLevel + 1;

    // Evita cicli: il nuovo genitore non può essere un discendente del trainer che spostiamo.
    const descendants = await collectDescendantIds(trainerId);
    if (descendants.has(newParentId)) {
      return { ok: false, error: "cycle" };
    }
  }

  await prisma.trainerProfile.update({
    where: { id: trainerId },
    data: { referredById: newParentId, referralLevel: newLevel },
  });
  await cascadeLevels(trainerId, newLevel);

  revalidatePath("/admin/network");
  return { ok: true };
}

async function collectDescendantIds(rootId: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let frontier = [rootId];
  while (frontier.length) {
    const children = await prisma.trainerProfile.findMany({
      where: { referredById: { in: frontier } },
      select: { id: true },
    });
    frontier = children.map((c) => c.id).filter((id) => !ids.has(id));
    frontier.forEach((id) => ids.add(id));
  }
  return ids;
}

async function cascadeLevels(parentId: string, parentLevel: number) {
  const children = await prisma.trainerProfile.findMany({
    where: { referredById: parentId },
    select: { id: true },
  });
  for (const child of children) {
    const childLevel = parentLevel + 1;
    await prisma.trainerProfile.update({ where: { id: child.id }, data: { referralLevel: childLevel } });
    await cascadeLevels(child.id, childLevel);
  }
}
