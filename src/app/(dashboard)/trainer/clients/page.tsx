import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export default async function ClientsPage() {
  const user = await requireRole("TRAINER");
  const trainer = user.trainerProfile!;

  const clients = await prisma.clientProfile.findMany({
    where: { trainerId: trainer.id },
    include: {
      user: true,
      workoutPlans: { where: { isActive: true }, take: 1 },
      sessions: { orderBy: { completedAt: "desc" }, take: 1 },
      progressLogs: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clienti</h1>
          <p className="text-slate-500 mt-1">
            {clients.length} cliente{clients.length !== 1 ? "i" : ""}
          </p>
        </div>
        <Button render={<Link href="/trainer/clients/new" />}>
          <UserPlus className="h-4 w-4 mr-2" />
          Aggiungi cliente
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-400 text-sm">Nessun cliente ancora.</p>
            <Button render={<Link href="/trainer/clients/new" />} className="mt-4">
              Aggiungi il primo cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => {
            const lastSession = client.sessions[0];
            const lastLog = client.progressLogs[0];
            const activePlan = client.workoutPlans[0];

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
                          ? `Ultima sessione ${formatDistanceToNow(lastSession.completedAt, { locale: it, addSuffix: true })}`
                          : "Nessuna sessione"}
                        {lastLog?.weight && ` · ${lastLog.weight} kg`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {client.goals.slice(0, 2).map((goal) => (
                        <Badge key={goal} variant="outline" className="text-xs hidden sm:flex">
                          {goal}
                        </Badge>
                      ))}
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
