"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type AddClientState = { error?: string; success?: string };

export async function addClientByEmail(
  _prev: AddClientState,
  formData: FormData
): Promise<AddClientState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "TRAINER" || !user.trainerProfile) {
    return { error: "Non autorizzato." };
  }

  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  if (!email) return { error: "Inserisci un'email." };

  const target = await prisma.user.findUnique({
    where: { email },
    include: { clientProfile: true },
  });

  if (!target) {
    return {
      error: "Nessun utente registrato con questa email. Invitalo con il link qui sopra.",
    };
  }
  if (target.id === user.id) {
    return { error: "Non puoi aggiungere te stesso." };
  }
  if (target.role !== "CLIENT") {
    return {
      error: "Questa email appartiene a un trainer/admin e non può essere aggiunta come cliente.",
    };
  }
  if (
    target.clientProfile &&
    target.clientProfile.trainerId !== user.trainerProfile.id
  ) {
    return { error: "Questo utente è già collegato a un altro trainer." };
  }

  await prisma.clientProfile.upsert({
    where: { userId: target.id },
    update: { trainerId: user.trainerProfile.id },
    create: { userId: target.id, trainerId: user.trainerProfile.id },
  });

  revalidatePath("/trainer/clients");
  return { success: `${target.name || email} è stato collegato come tuo cliente.` };
}
