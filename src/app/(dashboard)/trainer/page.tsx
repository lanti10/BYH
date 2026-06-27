import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Activity, ShoppingBag, TrendingUp } from "lucide-react";
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

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Ciao, {user.name.split(" ")[0]}
        </h1>
        <p className="text-slate-500 mt-1">Ecco il riepilogo di oggi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Clienti attivi", value: clients.length, icon: Users },
          { label: "Messaggi non letti", value: recentMessages.length, icon: Activity },
          { label: "Raccomandazioni in attesa", value: pendingRecs.length, icon: ShoppingBag },
          { label: "Guadagni totali", value: `€${totalEarnings.toFixed(2)}`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
              <Icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Client list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">I tuoi clienti</CardTitle>
            <Link href="/trainer/clients" className="text-sm text-blue-600 hover:underline">
              Vedi tutti
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {clients.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                Nessun cliente ancora.{" "}
                <Link href="/trainer/clients" className="text-blue-600 hover:underline">
                  Aggiungine uno
                </Link>
              </p>
            )}
            {clients.slice(0, 6).map((client) => {
              const lastSession = client.sessions[0];
              return (
                <Link
                  key={client.id}
                  href={`/trainer/clients/${client.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={client.user.avatarUrl ?? undefined} />
                    <AvatarFallback>{client.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.user.name}</p>
                    <p className="text-xs text-slate-400">
                      {lastSession
                        ? `Ultima sessione ${formatDistanceToNow(lastSession.completedAt, { locale: it, addSuffix: true })}`
                        : "Nessuna sessione ancora"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {client.goals[0] ?? "—"}
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Pending AI recommendations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Raccomandazioni da validare</CardTitle>
            <Link href="/trainer/products" className="text-sm text-blue-600 hover:underline">
              Vedi tutte
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRecs.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                Nessuna raccomandazione in attesa.
              </p>
            )}
            {pendingRecs.map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{rec.product.name}</p>
                  <p className="text-xs text-slate-500">per {rec.client.user.name}</p>
                </div>
                <Link
                  href={`/trainer/products/recommendations/${rec.id}`}
                  className="text-xs text-amber-700 font-medium hover:underline shrink-0"
                >
                  Valida →
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
