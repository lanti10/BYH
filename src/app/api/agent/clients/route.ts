import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentAuthorized } from "@/lib/agent/auth";

export const maxDuration = 30;

// L'agente elenca i clienti di un trainer (per email) così da poter assegnare la scheda
// al cliente giusto. Protetta da Bearer AGENT_API_KEY.
export async function GET(req: Request) {
  if (!agentAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const trainerEmail = searchParams.get("trainerEmail")?.trim().toLowerCase();
  if (!trainerEmail) {
    return NextResponse.json({ error: "Parametro trainerEmail obbligatorio." }, { status: 400 });
  }

  const trainerUser = await prisma.user.findFirst({
    where: { email: { equals: trainerEmail, mode: "insensitive" }, role: "TRAINER" },
    include: { trainerProfile: true },
  });
  if (!trainerUser?.trainerProfile) {
    return NextResponse.json({ error: `Nessun trainer con email ${trainerEmail}.` }, { status: 404 });
  }

  const clients = await prisma.clientProfile.findMany({
    where: { trainerId: trainerUser.trainerProfile.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    clients: clients.map((c) => ({
      name: c.user.name || c.user.email,
      email: c.user.email,
    })),
  });
}
