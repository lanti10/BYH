import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Salva (o aggiorna) l'iscrizione Web Push del device dell'utente corrente.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await req.json().catch(() => null);
  const endpoint: string | undefined = sub?.endpoint;
  const p256dh: string | undefined = sub?.keys?.p256dh;
  const auth: string | undefined = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Bad subscription" }, { status: 400 });
  }

  // endpoint è unico: se esiste già, lo ri-associo all'utente/chiavi correnti.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: me.id, endpoint, p256dh, auth },
    update: { userId: me.id, p256dh, auth },
  });

  return NextResponse.json({ ok: true });
}

// Rimuove l'iscrizione (es. l'utente disattiva le notifiche o cambia device).
export async function DELETE(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const endpoint: string | undefined = body?.endpoint;
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: me.id } });
  return NextResponse.json({ ok: true });
}
