import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VARIANTS = new Set(["photo", "rings", "record", "month", "medal", "coach"]);

// Registra una card condivisa. Chiamata dal foglio di condivisione DOPO che il menu
// del telefono ha restituito il controllo, così contiamo le condivisioni davvero
// partite e non i ripensamenti.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { variant, shared } = await req.json().catch(() => ({}));
  if (!VARIANTS.has(variant)) {
    return NextResponse.json({ error: "Variante non valida" }, { status: 400 });
  }

  await prisma.shareEvent.create({
    data: { userId: me.id, variant, role: me.role, shared: shared !== false },
  });

  return NextResponse.json({ ok: true });
}
