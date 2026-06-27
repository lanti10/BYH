import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dumbbell, MessageSquare, TrendingUp, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ProgressChart } from "@/components/trainer/progress-chart";

export default async function ClientDashboard() {
  const user = await requireRole("CLIENT");
  const client = user.clientProfile!;

  const [profile, recommendations] = await Promise.all([
    prisma.clientProfile.findUnique({
      where: { id: client.id },
      include: {
        trainer: { include: { user: true } },
        workoutPlans: {
          where: { isActive: true },
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
          take: 1,
        },
        sessions: { orderBy: { completedAt: "desc" }, take: 10 },
        progressLogs: { orderBy: { date: "asc" }, take: 30 },
      },
    }),
    prisma.productRecommendation.findMany({
      where: { clientId: client.id, approvedAt: { not: null }, dismissedAt: null },
      include: { product: true },
      orderBy: { approvedAt: "desc" },
      take: 3,
    }),
  ]);

  if (!profile || !profile.trainer) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold text-slate-700">In attesa del tuo trainer</p>
          <p className="text-slate-400 text-sm">Il tuo profilo verrà attivato quando un trainer ti aggiungerà alla sua lista clienti.</p>
        </div>
      </div>
    );
  }

  const progressData = profile.progressLogs.map((log) => ({
    date: log.date.toLocaleDateString("it-IT", { month: "short", day: "numeric" }),
    peso: log.weight,
    grasso: log.bodyFat,
  }));

  const activePlan = profile.workoutPlans[0];
  const todayIndex = (new Date().getDay() + 6) % 7; // 0=Mon
  const todayWorkout = activePlan?.workouts.find((w) => w.dayOfWeek === todayIndex);

  const dayNames = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Ciao, {user.name.split(" ")[0]}
        </h1>
        <p className="text-slate-500 mt-1">
          {dayNames[todayIndex]} — {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's workout */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Allenamento di oggi</CardTitle>
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/client/workout" />}
              >
                Vedi scheda completa
              </Button>
            </CardHeader>
            <CardContent>
              {todayWorkout ? (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-700">{todayWorkout.name}</p>
                  <div className="space-y-2 mt-3">
                    {todayWorkout.exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Dumbbell className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ex.exercise.name}</p>
                          <p className="text-xs text-slate-400">
                            {ex.sets} serie × {ex.reps} rep
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {ex.restSeconds}s rest
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                    render={<Link href="/client/workout/session" />}
                  >
                    Avvia sessione
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">
                    {activePlan
                      ? "Nessun allenamento previsto per oggi. Riposati!"
                      : "Nessuna scheda assegnata ancora."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {progressData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">I tuoi progressi</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressChart data={progressData} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Trainer card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">Il tuo trainer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={profile.trainer.user.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    {profile.trainer.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{profile.trainer.user.name}</p>
                  <p className="text-xs text-slate-400">{profile.trainer.user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                render={<Link href="/client/messages" />}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Scrivi al trainer
              </Button>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Dumbbell className="h-4 w-4" />
                  Sessioni completate
                </div>
                <span className="font-bold">{profile.sessions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <TrendingUp className="h-4 w-4" />
                  Peso attuale
                </div>
                <span className="font-bold">
                  {profile.progressLogs[profile.progressLogs.length - 1]?.weight ?? "—"} kg
                </span>
              </div>
            </CardContent>
          </Card>

          {recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4" />
                  Consigliati dal trainer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-sm font-medium">{rec.product.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">€{rec.product.salePrice.toFixed(2)}</p>
                    <Button
                      size="sm"
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                      render={<Link href={`/client/shop/${rec.product.id}`} />}
                    >
                      Acquista
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
