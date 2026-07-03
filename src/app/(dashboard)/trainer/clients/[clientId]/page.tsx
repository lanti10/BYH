import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Dumbbell, TrendingUp } from "lucide-react";
import Link from "next/link";
import { ProgressChart } from "@/components/trainer/progress-chart";
import { PlanDayTabs } from "@/components/shared/plan-day-tabs";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireRole("TRAINER");
  const trainer = user.trainerProfile!;

  const client = await prisma.clientProfile.findFirst({
    where: { id: clientId, trainerId: trainer.id },
    include: {
      user: true,
      workoutPlans: {
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
      sessions: { orderBy: { completedAt: "desc" }, take: 10 },
    },
  });

  if (!client) notFound();

  const progressData = client.progressLogs.map((log) => ({
    date: log.date.toLocaleDateString("it-IT", { month: "short", day: "numeric" }),
    peso: log.weight,
    grasso: log.bodyFat,
  }));

  return (
    <div className="p-4 sm:p-8 space-y-6">
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
                <Badge key={goal} variant="secondary">{goal}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/trainer/messages?client=${client.userId}`} />}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Messaggio
          </Button>
          <Button
            size="sm"
            render={<Link href={`/trainer/workouts/new?client=${client.id}`} />}
          >
            <Dumbbell className="h-4 w-4 mr-1" />
            Nuova scheda
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{client.startWeight ?? "—"}</p>
            <p className="text-xs text-slate-500 mt-1">Peso iniziale (kg)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">
              {client.progressLogs[client.progressLogs.length - 1]?.weight ?? "—"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Peso attuale (kg)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{client.sessions.length}</p>
            <p className="text-xs text-slate-500 mt-1">Sessioni completate</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheda profilo del cliente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profilo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {client.profileCompleted ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {client.sex && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {client.sex}
                  </span>
                )}
                {client.birthDate && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {Math.floor((Date.now() - new Date(client.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} anni
                  </span>
                )}
                {client.height && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {client.height} cm
                  </span>
                )}
                {client.trainingDaysPerWeek && (
                  <span className="rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                    {client.trainingDaysPerWeek} allenamenti/sett
                  </span>
                )}
                {client.goals.map((g) => (
                  <span key={g} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {g}
                  </span>
                ))}
              </div>
              {client.notes && (
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-500">Note: </span>
                  {client.notes}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Il cliente non ha ancora completato il suo profilo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="progress">
        <TabsList>
          <TabsTrigger value="progress">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Progressi
          </TabsTrigger>
          <TabsTrigger value="workouts">
            <Dumbbell className="h-4 w-4 mr-1.5" />
            Schede
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Andamento peso</CardTitle>
            </CardHeader>
            <CardContent>
              {progressData.length > 0 ? (
                <ProgressChart data={progressData} />
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nessun dato di progresso ancora.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workouts" className="mt-4 space-y-4">
          {client.workoutPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-400 text-sm">Nessuna scheda assegnata.</p>
                <Button
                  size="sm"
                  className="mt-3"
                  render={<Link href={`/trainer/workouts/new?client=${client.id}`} />}
                >
                  Crea scheda
                </Button>
              </CardContent>
            </Card>
          ) : (
            client.workoutPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {plan.isActive && (
                      <Badge variant="default" className="bg-green-600">Attiva</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/trainer/workouts/${plan.id}`} />}
                    >
                      Apri
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <PlanDayTabs
                    days={plan.workouts.map((day) => ({
                      id: day.id,
                      name: day.name,
                      exercises: day.exercises.map((ex) => ({
                        id: ex.id,
                        name: ex.exercise.name,
                        sets: ex.sets,
                        reps: ex.reps,
                        weight: ex.weight,
                        restSeconds: ex.restSeconds,
                      })),
                    }))}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
