import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

type Role = "ADMIN" | "TRAINER" | "CLIENT";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const include = { trainerProfile: true, clientProfile: true } as const;
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, include });
  if (!user) return null;

  // Mantieni foto profilo e nome allineati a Clerk (così la foto caricata si propaga ovunque)
  try {
    const cu = await currentUser();
    if (cu) {
      const avatarUrl = cu.imageUrl ?? null;
      const name = `${cu.firstName ?? ""} ${cu.lastName ?? ""}`.trim() || user.name;
      if (avatarUrl !== user.avatarUrl || name !== user.name) {
        return prisma.user.update({ where: { id: user.id }, data: { avatarUrl, name }, include });
      }
    }
  } catch {
    /* ignora errori di sync */
  }

  return user;
}

export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== role) redirect("/dashboard");
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}
