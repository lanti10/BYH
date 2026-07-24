"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { revalidatePath } from "next/cache";

// Aggiunge/rimuove un prodotto dalla lista "consigliati" del PT.
// I clienti del PT lo vedranno nel segmento "Consigliati dal tuo PT".
export async function togglePick(productId: string): Promise<{ picked: boolean }> {
  const me = await getCurrentUser();
  if (!me?.trainerProfile) throw new Error("Forbidden");
  const trainerId = me.trainerProfile.id;

  const existing = await prisma.trainerProductPick.findUnique({
    where: { trainerId_productId: { trainerId, productId } },
  });

  if (existing) {
    await prisma.trainerProductPick.delete({ where: { id: existing.id } });
    revalidatePath("/trainer/products");
    return { picked: false };
  }

  await prisma.trainerProductPick.create({ data: { trainerId, productId } });
  revalidatePath("/trainer/products");
  return { picked: true };
}

// Condivide un prodotto in chat privata con un cliente, con una nota personale.
// Crea la raccomandazione (per l'attribuzione) + un messaggio di tipo prodotto.
export async function shareProductInChat(
  productId: string,
  clientUserId: string,
  note: string,
): Promise<{ ok: true }> {
  const me = await getCurrentUser();
  if (!me?.trainerProfile) throw new Error("Forbidden");

  // Verifica che sia davvero un cliente di questo PT
  const client = await prisma.clientProfile.findFirst({
    where: { userId: clientUserId, trainerId: me.trainerProfile.id },
  });
  if (!client) throw new Error("Forbidden");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Not found");

  const trimmed = note.trim();

  const recommendation = await prisma.productRecommendation.create({
    data: {
      trainerId: me.trainerProfile.id,
      clientId: client.id,
      productId,
      trainerNote: trimmed || null,
      approvedAt: new Date(),
    },
  });

  await prisma.message.create({
    data: {
      senderId: me.id,
      receiverId: clientUserId,
      type: "PRODUCT_RECOMMENDATION",
      content: trimmed || product.name,
      recommendationId: recommendation.id,
    },
  });

  // Push best-effort (non deve mai far fallire la condivisione)
  try {
    await sendPushToUser(clientUserId, {
      title: me.name || "BYH",
      body: `${product.name}${trimmed ? ` — ${trimmed}` : ""}`,
      icon: me.avatarUrl || "/icon-192.png",
      url: "/client/messages",
      tag: `chat-${me.id}`,
    });
  } catch {
    /* best-effort */
  }

  return { ok: true };
}
