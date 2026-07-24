import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, ChevronRight } from "lucide-react";
import { DashboardStats, type MiniClient } from "@/components/trainer/dashboard-stats";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { dateFnsLocale } from "@/lib/i18n/datefns";
import { InstallPrompt } from "@/components/shared/install-prompt";

export default async function TrainerDashboard() {
  const user = await requireRole("TRAINER");
  const { t, locale } = await getT();
  const trainer = user.trainerProfile!;

  // Un cliente è "fermo" se non si allena da almeno 7 giorni
  const idleSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // I clienti del trainer, sempre senza l'auto-cliente (la sua scheda personale)
  const clientScope = { trainerId: trainer.id, userId: { not: user.id } };

  const [clients, pickedProducts, earnings] = await Promise.all([
    prisma.clientProfile.findMany({
      where: clientScope,
      include: {
        user: true,
        progressLogs: { orderBy: { date: "desc" }, take: 1 },
        sessions: { orderBy: { completedAt: "desc" }, take: 1 },
        workoutPlans: { where: { isActive: true }, take: 1, select: { id: true } },
      },
    }),
    prisma.trainerProductPick.count({ where: { trainerId: trainer.id } }),
    prisma.trainerEarning.aggregate({
      where: { trainerId: trainer.id },
      _sum: { amount: true },
    }),
  ]);

  const totalEarnings = earnings._sum.amount ?? 0;

  const nameOf = (c: (typeof clients)[number]) => c.user.name || c.user.email;
  const since = (d: Date) => formatDistanceToNow(d, { addSuffix: true, locale: dateFnsLocale(locale) });

  // Fermi = ultima sessione più vecchia di 7 giorni. Chi non si è mai allenato
  // conta solo se è iscritto da più di 7 giorni, così i nuovi non risultano fermi.
  const idleList: MiniClient[] = clients
    .filter((c) => {
      const last = c.sessions[0]?.completedAt;
      return last ? last < idleSince : c.createdAt < idleSince;
    })
    .map((c) => ({
      id: c.id,
      name: nameOf(c),
      avatarUrl: c.user.avatarUrl,
      subtitle: c.sessions[0]
        ? t("cl.lastSession", { time: since(c.sessions[0].completedAt) })
        : t("cl.noSession"),
    }));

  const noPlanList: MiniClient[] = clients
    .filter((c) => c.workoutPlans.length === 0)
    .map((c) => ({
      id: c.id,
      name: nameOf(c),
      avatarUrl: c.user.avatarUrl,
      subtitle: t("dash.noPlan"),
    }));

  // La dashboard è un colpo d'occhio: solo i clienti con l'attività più recente.
  // L'elenco completo (con ricerca e non letti) è la pagina Clienti, dietro "Vedi tutti".
  const recentClients = [...clients]
    .sort(
      (a, b) =>
        (b.sessions[0]?.completedAt.getTime() ?? 0) - (a.sessions[0]?.completedAt.getTime() ?? 0)
    )
    .slice(0, 3);


  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Installa l'app sulla Home (PWA) */}
      <InstallPrompt />

      {/* Hero */}
      <div className="rounded-3xl bg-depth-dark p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm">{t("tr.welcome")}</p>
            <h1 className="text-3xl font-bold tracking-tight mt-0.5">{user.name.split(" ")[0]}</h1>
            <p className="text-white/80 mt-2 text-sm">
              {clients.length === 0
                ? t("tr.startFirst")
                : t("tr.following", { n: clients.length })}
            </p>
          </div>
          <Link
            href="/trainer/clients/new"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/25"
          >
            <UserPlus className="h-4 w-4" /> {t("tr.addClient")}
          </Link>
        </div>
        <Link
          href="/trainer/clients/new"
          className="sm:hidden mt-4 flex items-center justify-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur"
        >
          <UserPlus className="h-4 w-4" /> {t("tr.addClient")}
        </Link>
      </div>

      {/* Stats */}
      <DashboardStats
        idle={idleList}
        noPlan={noPlanList}
        pickedProducts={pickedProducts}
        earnings={`€${totalEarnings.toFixed(2)}`}
      />

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Client list */}
        <div className="rounded-3xl glass p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">{t("tr.yourClients")}</h2>
            <Link href="/trainer/clients" className="text-sm font-medium text-brand hover:underline">
              {t("tr.seeAll")}
            </Link>
          </div>
          <div className="space-y-1">
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 mb-3">{t("tr.noClients")}</p>
                <Link
                  href="/trainer/clients/new"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  <UserPlus className="h-4 w-4" /> {t("tr.addFirst")}
                </Link>
              </div>
            ) : (
              recentClients.map((client) => {
                const lastSession = client.sessions[0];
                return (
                  <Link
                    key={client.id}
                    href={`/trainer/clients/${client.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={client.user.avatarUrl ?? undefined} />
                      <AvatarFallback>{client.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{client.user.name}</p>
                      <p className="text-xs text-slate-400">
                        {lastSession
                          ? t("tr.activeAgo", { time: formatDistanceToNow(lastSession.completedAt, { locale: dateFnsLocale(locale), addSuffix: true }) })
                          : t("tr.noSessionYet")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
