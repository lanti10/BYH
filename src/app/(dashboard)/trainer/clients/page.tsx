import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { ClientsList, type ClientRow } from "@/components/trainer/clients-list";

export default async function ClientsPage() {
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;

  const rawClients = await prisma.clientProfile.findMany({
    where: { trainerId: trainer.id },
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

  const clientRows: ClientRow[] = rawClients.map((c) => ({
    id: c.id,
    userId: c.userId,
    name: c.user.name || c.user.email,
    avatarUrl: c.user.avatarUrl,
    activePlanName: c.workoutPlans[0]?.name ?? null,
    lastSessionAt: c.sessions[0]?.completedAt.getTime() ?? null,
    lastWeight: c.progressLogs[0]?.weight ?? null,
    goals: c.goals,
    createdAt: c.createdAt.getTime(),
  }));
  const initialActivity = rawClients.map((c) => ({
    userId: c.userId,
    lastAt: lastAtByUser.get(c.userId) ?? null,
    unread: unreadByUser.get(c.userId) ?? 0,
  }));

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav.clients")}</h1>
          <p className="text-slate-500 mt-1">{t("cl.count", { n: rawClients.length })}</p>
        </div>
        <Button render={<Link href="/trainer/clients/new" />}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t("tr.addClient")}
        </Button>
      </div>

      {rawClients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-400 text-sm">{t("tr.noClients")}</p>
            <Button render={<Link href="/trainer/clients/new" />} className="mt-4">
              {t("cl.addFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ClientsList clients={clientRows} initialActivity={initialActivity} />
      )}
    </div>
  );
}
