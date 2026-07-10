import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { GOAL_KEYS } from "@/lib/i18n/dict";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { dateFnsLocale } from "@/lib/i18n/datefns";

export default async function ClientsPage() {
  const user = await requireRole("TRAINER");
  const { t, locale } = await getT();
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

  // Ordine "stile WhatsApp": in cima chi ha l'ultimo messaggio più recente.
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
    // convo è ordinato desc → il primo che incontro per ciascuno è il più recente
    if (!lastAtByUser.has(other)) lastAtByUser.set(other, m.createdAt.getTime());
  }

  // Messaggi non letti per cliente (il pallino sulla riga)
  const unreadRows = await prisma.message.groupBy({
    by: ["senderId"],
    where: { receiverId: user.id, readAt: null, senderId: { in: clientUserIds } },
    _count: true,
  });
  const unreadByUser = new Map(unreadRows.map((r) => [r.senderId, r._count]));

  const clients = [...rawClients].sort((a, b) => {
    const ta = lastAtByUser.get(a.userId) ?? 0;
    const tb = lastAtByUser.get(b.userId) ?? 0;
    if (tb !== ta) return tb - ta; // ultimo messaggio più recente in cima
    return b.createdAt.getTime() - a.createdAt.getTime(); // senza messaggi: più recenti prima
  });

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav.clients")}</h1>
          <p className="text-slate-500 mt-1">
            {t("cl.count", { n: clients.length })}
          </p>
        </div>
        <Button render={<Link href="/trainer/clients/new" />}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t("tr.addClient")}
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-400 text-sm">{t("tr.noClients")}</p>
            <Button render={<Link href="/trainer/clients/new" />} className="mt-4">
              {t("cl.addFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => {
            const lastSession = client.sessions[0];
            const lastLog = client.progressLogs[0];
            const activePlan = client.workoutPlans[0];
            const unread = unreadByUser.get(client.userId) ?? 0;

            return (
              <Link key={client.id} href={`/trainer/clients/${client.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar>
                      <AvatarImage src={client.user.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        {client.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{client.user.name}</p>
                        {activePlan && (
                          <Badge variant="secondary" className="text-xs">
                            {activePlan.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lastSession
                          ? t("cl.lastSession", { time: formatDistanceToNow(lastSession.completedAt, { locale: dateFnsLocale(locale), addSuffix: true }) })
                          : t("cl.noSession")}
                        {lastLog?.weight && ` · ${lastLog.weight} kg`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {client.goals.slice(0, 2).map((goal) => (
                        <Badge key={goal} variant="outline" className="text-xs hidden sm:flex">
                          {t(GOAL_KEYS[goal] ?? goal)}
                        </Badge>
                      ))}
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white tnum">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
