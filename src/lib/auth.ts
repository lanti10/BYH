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
  // L'admin è un permesso che si somma al ruolo: chi ce l'ha usa l'app come
  // trainer (o cliente) e in più entra nel pannello, senza dover scegliere.
  if (role === "ADMIN") {
    if (!canAdmin(user)) redirect("/dashboard");
    return user;
  }
  if (user.role !== role) redirect("/dashboard");
  return user;
}

/** Può entrare nel pannello: per permesso, o perché è un account di sola amministrazione. */
export function canAdmin(user: { role: string; isAdmin: boolean }) {
  return user.isAdmin || user.role === "ADMIN";
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}
