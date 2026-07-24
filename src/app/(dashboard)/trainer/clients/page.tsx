import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { ClientsList, type ClientRow } from "@/components/trainer/clients-list";

// ?f=idle  → solo i clienti fermi da 7+ giorni
// ?f=noplan → solo i clienti senza scheda attiva
// (ci arrivi dalle tessere della dashboard)
export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f: filter } = await searchParams;
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;

  const rawClients = await prisma.clientProfile.findMany({
    // Esclude l'auto-cliente del PT (la sua scheda personale) dalla lista clienti
    where: { trainerId: trainer.id, userId: { not: user.id } },
    include: {
      user: true,
      workoutPlans: { where: { isActive: true }, take: 1 },
      sessions: { orderBy: { completedAt: "desc" }, take: 1 },
      progressLogs: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  // Attività iniziale (ultimo messaggio + non letti) — poi aggiornata in tempo reale lato client.
  const clientUserIds = rawClients.map((c) => c.userId);
  const convo = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: { in: clientUserIds } },
        { senderId: { in: clientUserIds }, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { senderId: true, receiverId: true, createdAt: true },
  });
  const lastAtByUser = new Map<string, number>();
  for (const m of convo) {
    const other = m.senderId === user.id ? m.receiverId : m.senderId;
    if (!lastAtByUser.has(other)) lastAtByUser.set(other, m.createdAt.getTime());
  }
  const unreadRows = await prisma.message.groupBy({
    by: ["senderId"],
    where: { receiverId: user.id, readAt: null, senderId: { in: clientUserIds } },
    _count: true,
  });
  const unreadByUser = new Map(unreadRows.map((r) => [r.senderId, r._count]));

  // PT che hai portato in rete col link /join-trainer: non sono tuoi clienti
  // (sono TrainerProfile con referredById), ma li vuoi vedere qui, etichettati.
  const referredTrainers = await prisma.trainerProfile.findMany({
    where: { referredById: trainer.id },
    include: { user: true, _count: { select: { clients: true } } },
    orderBy: { createdAt: "desc" },
  });

  const clientRows: ClientRow[] = rawClients.map((c) => ({
    id: c.id,
    userId: c.userId,
    kind: "client" as const,
    name: c.user.name || c.user.email,
    avatarUrl: c.user.avatarUrl,
    activePlanName: c.workoutPlans[0]?.name ?? null,
    lastSessionAt: c.sessions[0]?.completedAt.getTime() ?? null,
    lastWeight: c.progressLogs[0]?.weight ?? null,
    goals: c.goals,
    createdAt: c.createdAt.getTime(),
  }));
  const trainerRows: ClientRow[] = referredTrainers.map((tr) => ({
    id: tr.id,
    userId: tr.userId,
    kind: "trainer" as const,
    name: tr.user.name || tr.user.email,
    avatarUrl: tr.user.avatarUrl,
    activePlanName: null,
    lastSessionAt: null,
    lastWeight: null,
    goals: [],
    createdAt: tr.createdAt.getTime(),
    clientsCount: tr._count.clients,
  }));
  // Filtro dalla dashboard: restringe ai soli clienti da sistemare
  const idleSince = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const allRows = [...clientRows, ...trainerRows];
  const rows =
    filter === "idle"
      ? clientRows.filter((r) => (r.lastSessionAt ? r.lastSessionAt < idleSince : r.createdAt < idleSince))
      : filter === "noplan"
        ? clientRows.filter((r) => !r.activePlanName)
        : allRows;
  const filterLabel =
    filter === "idle" ? t("tr.idleClients") : filter === "noplan" ? t("tr.noPlan") : null;

  const initialActivity = rawClients.map((c) => ({
    userId: c.userId,
    lastAt: lastAtByUser.get(c.userId) ?? null,
    unread: unreadByUser.get(c.userId) ?? 0,
  }));

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">{t("nav.clients")}</h1>
          <p className="text-slate-500 mt-1">
            {filterLabel
              ? t("cl.count", { n: rows.length })
              : t("cl.count", { n: rawClients.length }) +
                (trainerRows.length > 0 ? ` · ${t("cl.ptCount", { n: trainerRows.length })}` : "")}
          </p>
        </div>
        <Button className="shrink-0" render={<Link href="/trainer/clients/new" />}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t("tr.addClient")}
        </Button>
      </div>

      {filterLabel && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand px-3 py-1.5 text-[13px] font-medium text-white">
            {filterLabel}
          </span>
          <Link href="/trainer/clients" className="text-[13px] font-medium text-slate-500 hover:underline">
            {t("cl.showAll")}
          </Link>
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-400 text-sm">{t("tr.noClients")}</p>
            <Button render={<Link href="/trainer/clients/new" />} className="mt-4">
              {t("cl.addFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ClientsList clients={rows} initialActivity={initialActivity} />
      )}
    </div>
  );
}
