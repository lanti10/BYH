import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageCircle, ShoppingBag, TrendingUp, UserPlus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export default async function TrainerDashboard() {
  const user = await requireRole("TRAINER");
  const trainer = user.trainerProfile!;

  const [clients, recentMessages, pendingRecs, earnings] = await Promise.all([
    prisma.clientProfile.findMany({
      where: { trainerId: trainer.id },
      include: {
        user: true,
        progressLogs: { orderBy: { date: "desc" }, take: 1 },
        sessions: { orderBy: { completedAt: "desc" }, take: 1 },
      },
    }),
    prisma.message.findMany({
      where: { receiverId: user.id, readAt: null },
      include: { sender: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.productRecommendation.findMany({
      where: { trainerId: trainer.id, approvedAt: null, dismissedAt: null },
      include: { product: true, client: { include: { user: true } } },
      take: 5,
    }),
    prisma.trainerEarning.aggregate({
      where: { trainerId: trainer.id },
      _sum: { amount: true },
    }),
  ]);

  const totalEarnings = earnings._sum.amount ?? 0;

  const stats = [
    { label: "Clienti attivi", value: clients.length, icon: Users, tint: "bg-emerald-500/10 text-emerald-600" },
    { label: "Messaggi non letti", value: recentMessages.length, icon: MessageCircle, tint: "bg-blue-500/10 text-blue-600" },
    { label: "Da validare", value: pendingRecs.length, icon: ShoppingBag, tint: "bg-amber-500/10 text-amber-600" },
    { label: "Guadagni totali", value: `€${totalEarnings.toFixed(2)}`, icon: TrendingUp, tint: "bg-brand/10 text-brand" },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="rounded-3xl bg-depth-dark p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm">Bentornato</p>
            <h1 className="text-3xl font-bold tracking-tight mt-0.5">{user.name.split(" ")[0]}</h1>
            <p className="text-white/80 mt-2 text-sm">
              {clients.length === 0
                ? "Inizia invitando il tuo primo cliente."
                : `Stai seguendo ${clients.length} client${clients.length === 1 ? "e" : "i"}.`}
            </p>
          </div>
          <Link
            href="/trainer/clients/new"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/25"
          >
            <UserPlus className="h-4 w-4" /> Aggiungi cliente
          </Link>
        </div>
        <Link
          href="/trainer/clients/new"
          className="sm:hidden mt-4 flex items-center justify-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur"
        >
          <UserPlus className="h-4 w-4" /> Aggiungi cliente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="rounded-2xl glass p-4 sm:p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint} mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none">{value}</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Client list */}
        <div className="rounded-3xl glass p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">I tuoi clienti</h2>
            <Link href="/trainer/clients" className="text-sm font-medium text-brand hover:underline">
              Vedi tutti
            </Link>
          </div>
          <div className="space-y-1">
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 mb-3">Nessun cliente ancora.</p>
                <Link
                  href="/trainer/clients/new"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  <UserPlus className="h-4 w-4" /> Aggiungi il primo
                </Link>
              </div>
            ) : (
              clients.slice(0, 6).map((client) => {
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
                          ? `Attivo ${formatDistanceToNow(lastSession.completedAt, { locale: it, addSuffix: true })}`
                          : "Nessuna sessione ancora"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Pending recommendations */}
        <div className="rounded-3xl glass p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Raccomandazioni da validare</h2>
            <Link href="/trainer/products" className="text-sm font-medium text-brand hover:underline">
              Vedi tutte
            </Link>
          </div>
          <div className="space-y-2">
            {pendingRecs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Nessuna raccomandazione in attesa.
              </p>
            ) : (
              pendingRecs.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{rec.product.name}</p>
                    <p className="text-xs text-slate-500">per {rec.client.user.name}</p>
                  </div>
                  <Link
                    href={`/trainer/products/recommendations/${rec.id}`}
                    className="text-xs font-semibold text-amber-700 hover:underline shrink-0"
                  >
                    Valida →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
