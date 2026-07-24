import { PendingPlanCard } from "@/components/trainer/pending-plan-card";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { GOAL_KEYS, SEX_KEYS } from "@/lib/i18n/dict";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { SessionHistory, type HistSession } from "@/components/shared/session-history";
import { toHistSession } from "@/lib/session-history";
import { ChatButton } from "@/components/trainer/chat-button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;

  const client = await prisma.clientProfile.findFirst({
    where: { id: clientId, trainerId: trainer.id },
    include: {
      user: true,
      // Solo le schede ATTIVE: una scheda staccata dal cliente (disattivata quando
      // gliene assegni una nuova, o scollegata a mano) deve sparire dal suo profilo.
      // Resta comunque consultabile in /trainer/workouts.
      workoutPlans: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        include: {
          workouts: {
            orderBy: { dayOfWeek: "asc" },
            include: {
              exercises: {
                include: { exercise: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
      progressLogs: { orderBy: { date: "asc" }, take: 30 },
      // Storico allenamenti del cliente: alimenta il conteggio e la sezione Progressi.
      sessions: {
        orderBy: { completedAt: "desc" },
        take: 400,
        include: {
          workoutDay: {
            include: {
              plan: { select: { planType: true } },
              exercises: {
                orderBy: { order: "asc" },
                include: { exercise: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!client) notFound();

  // Messaggi non letti da questo cliente (badge sul tasto Chat)
  const unread = await prisma.message.count({
    where: { receiverId: user.id, senderId: client.userId, readAt: null },
  });

  // Statistiche degli allenamenti del cliente, viste dal trainer (stesso formato
  // dello storico del PT: fiches per mese, tap = dettaglio della sessione).
  const history: HistSession[] = client.sessions.map(toHistSession);
  const totalMin = client.sessions.reduce((a, s) => a + (s.durationMin ?? 0), 0);
  const totalCal = client.sessions.reduce((a, s) => a + (s.calories ?? 0), 0);

  // La scheda corrente del cliente: la apre il tasto "Scheda" in alto.
  const activePlan = client.workoutPlans[0] ?? null;

  // Scheda creata dal cliente e in attesa di approvazione (non scavalca la tua)
  const pendingPlan = await prisma.workoutPlan.findFirst({
    where: { clientId: client.id, pendingApproval: true },
    orderBy: { createdAt: "desc" },
    include: { workouts: { include: { _count: { select: { exercises: true } } } } },
  });

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {pendingPlan && (
        <PendingPlanCard
          planId={pendingPlan.id}
          planName={pendingPlan.name}
          daysCount={pendingPlan.workouts.length}
          exercisesCount={pendingPlan.workouts.reduce((a, w) => a + w._count.exercises, 0)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Avatar size="lg">
            <AvatarImage src={client.user.avatarUrl ?? undefined} />
            <AvatarFallback>{client.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 truncate">{client.user.name}</h1>
            <p className="text-slate-500 text-sm truncate">{client.user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {client.goals.map((goal) => (
                <Badge key={goal} variant="secondary">{t(GOAL_KEYS[goal] ?? goal)}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <ChatButton withUserId={client.userId} initialUnread={unread} />
          {/* Scheda corrente (da lì si apre e si modifica). Se il cliente non ne ha
              ancora una, lo stesso tasto porta a crearla. */}
          <Button
            size="sm"
            render={
              <Link
                href={
                  activePlan
                    ? `/trainer/workouts/${activePlan.id}`
                    : `/trainer/workouts/new?client=${client.id}`
                }
              />
            }
          >
            <Dumbbell className="h-4 w-4 mr-1" />
            {activePlan ? t("cd.plan") : t("cd.newPlan")}
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{client.startWeight ?? "—"}</p>
            <p className="text-xs text-slate-500 mt-1">{t("cd.startWeight")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">
              {client.progressLogs[client.progressLogs.length - 1]?.weight ?? "—"}
            </p>
            <p className="text-xs text-slate-500 mt-1">{t("cd.currentWeight")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{client.sessions.length}</p>
            <p className="text-xs text-slate-500 mt-1">{t("cd.sessions")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheda profilo del cliente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("cd.profile")}</CardTitle>
        </CardHeader>
        <CardContent>
          {client.profileCompleted ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {client.sex && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {t(SEX_KEYS[client.sex] ?? client.sex)}
                  </span>
                )}
                {client.birthDate && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {t("u.years", { n: Math.floor((Date.now() - new Date(client.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) })}
                  </span>
                )}
                {client.height && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {client.height} cm
                  </span>
                )}
                {client.trainingDaysPerWeek && (
                  <span className="rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                    {t("u.trainPerWeek", { n: client.trainingDaysPerWeek })}
                  </span>
                )}
                {client.goals.map((g) => (
                  <span key={g} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {t(GOAL_KEYS[g] ?? g)}
                  </span>
                ))}
              </div>
              {client.notes && (
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-500">{t("cd.notes")} </span>
                  {client.notes}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              {t("cd.noProfile")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Allenamenti del cliente: totali + storico per mese, tap = statistiche */}
      <section>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="font-semibold text-slate-900">{t("hist.title")}</h2>
          {client.sessions.length > 0 && (
            <span className="text-xs text-slate-400 tnum">
              {totalMin} {t("dash.min")} · {totalCal} {t("prog.kcal")}
            </span>
          )}
        </div>
        <SessionHistory sessions={history} />
      </section>

    </div>
  );
}
