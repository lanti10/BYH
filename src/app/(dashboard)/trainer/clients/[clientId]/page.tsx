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
        include: {
          workouts: {
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
      <div className="flex items-start gap-4">
        <Avatar size="lg">
          <AvatarImage src={client.user.avatarUrl ?? undefined} />
          <AvatarFallback>{client.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{client.user.name}</h1>
          <p className="text-slate-500 text-sm">{client.user.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {client.goals.map((goal) => (
              <Badge key={goal} variant="secondary">{goal}</Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
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
                      render={<Link href={`/trainer/workouts/${plan.id}/edit`} />}
                    >
                      Modifica
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {plan.workouts.map((day) => (
                      <div key={day.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className="text-xs font-semibold text-slate-500 w-8 pt-0.5">
                          {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"][day.dayOfWeek]}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{day.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {day.exercises.map((ex) => ex.exercise.name).join(" · ")}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {day.exercises.length} esercizi
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
