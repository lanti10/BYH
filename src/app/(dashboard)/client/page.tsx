import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActivityRing } from "@/components/client/activity-ring";
import { StartWorkoutButton } from "@/components/shared/start-workout-button";
import { WeekStrip } from "@/components/client/week-strip";
import { getNextDayIndex, getScheduledTodayIndex, isDayDoneToday, estimateDuration, getStreak } from "@/lib/workout";
import { getT } from "@/lib/i18n/server";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import {
  Dumbbell, MessageSquare, ShoppingBag, Trophy,
  Flame, Timer, Check, ChevronRight,
} from "lucide-react";
import { computeMedals } from "@/lib/medals";
import Link from "next/link";
import { WeightWidget } from "@/components/client/weight-widget";
import { InstallPrompt } from "@/components/shared/install-prompt";

export default async function ClientDashboard() {
  const user = await requireRole("CLIENT");
  const client = user.clientProfile!;
  const { t, locale } = await getT();

  const [profile, recommendations, medalSessions] = await Promise.all([
    prisma.clientProfile.findUnique({
      where: { id: client.id },
      include: {
        trainer: { include: { user: true } },
        workoutPlans: {
          where: { isActive: true },
          include: {
            workouts: {
              orderBy: { dayOfWeek: "asc" },
              include: {
                exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
              },
            },
          },
          take: 1,
        },
        sessions: { orderBy: { completedAt: "desc" }, take: 60 },
        progressLogs: { orderBy: { date: "asc" }, take: 30 },
      },
    }),
    prisma.productRecommendation.findMany({
      where: { clientId: client.id, approvedAt: { not: null }, dismissedAt: null },
      include: { product: true },
      orderBy: { approvedAt: "desc" },
      take: 3,
    }),
    // Sessioni (solo date) per calcolare le medaglie sbloccate — vedi src/lib/medals.ts
    prisma.workoutSession.findMany({
      where: { clientId: client.id },
      select: { completedAt: true },
      take: 400,
    }),
  ]);

  // Numero di medaglie sbloccate (per il widget in dashboard)
  const unlockedMedals = computeMedals(medalSessions, client.trainingDaysPerWeek ?? 3).filter(
    (m) => m.unlocked
  ).length;

  if (!profile || !profile.trainer) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold text-slate-700">{t("dash.waiting")}</p>
          <p className="text-slate-400 text-sm">{t("dash.waitingSub")}</p>
        </div>
      </div>
    );
  }

  const activePlan = profile.workoutPlans[0];
  const sessions = profile.sessions;

  // ── Quale giorno tocca oggi ── (scheda pianificata per giorni fissi, altrimenti ciclica)
  const days = activePlan?.workouts ?? [];
  const scheduled = getScheduledTodayIndex(days);
  const cyclic = getNextDayIndex(days, sessions);
  const nextIndex = scheduled ? scheduled.index : cyclic.nextIndex;
  const restToday = scheduled?.restToday ?? false;
  const todayWorkout = days[nextIndex];
  const doneToday = scheduled
    ? todayWorkout != null && isDayDoneToday(todayWorkout.id, sessions)
    : cyclic.doneToday;
  const estMin = todayWorkout ? (todayWorkout.durationMin ?? estimateDuration(todayWorkout.exercises)) : 0;

  // ── Statistiche settimana corrente (lun–dom) ──
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const weekSessions = sessions.filter((s) => new Date(s.completedAt) >= monday);
  const weekGoal = profile.trainingDaysPerWeek ?? 3;
  const weekMin = weekSessions.reduce((s, x) => s + (x.durationMin ?? 0), 0);
  const weekCal = weekSessions.reduce((s, x) => s + (x.calories ?? 0), 0);
  const streak = getStreak(sessions);

  // ── Striscia dei 7 giorni della settimana ──
  const dayInitials = t("dash.weekInitials").split(",");
  const trainedKeys = new Set(
    sessions.map((s) => {
      const d = new Date(s.completedAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  const strip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: dayInitials[i],
      done: trainedKeys.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`),
      isToday: d.toDateString() === now.toDateString(),
    };
  });

  const lastWeight = profile.progressLogs[profile.progressLogs.length - 1]?.weight;

  return (
    <div className="p-4 sm:p-8 space-y-5 max-w-5xl mx-auto pb-10">
      {/* Installa l'app sulla Home (PWA) */}
      <InstallPrompt />

      {/* Saluto */}
      <div>
        <p className="text-[13px] text-slate-500 capitalize">
          {now.toLocaleDateString(DATE_LOCALE[locale], { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-[28px] leading-tight font-bold text-slate-900 tracking-tight">
          {t("dash.hi", { name: user.name.split(" ")[0] })}
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Colonna principale ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* HERO: l'allenamento che tocca OGGI (progressione automatica) */}
          {todayWorkout ? (
            <div className="rounded-3xl bg-depth-dark p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/50">
                  {restToday ? t("dash.restToday") : t("dash.dayOf", { n: nextIndex + 1, total: days.length })}
                </p>
                {doneToday && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                    <Check className="h-3 w-3" strokeWidth={3} /> {t("dash.doneToday")}
                  </span>
                )}
              </div>
              <h2 className="text-[22px] font-semibold tracking-tight">
                {todayWorkout.name || t("plan.dayN", { n: nextIndex + 1 })}
              </h2>
              <p className="mt-1 text-sm text-white/60 tnum">
                {t("dash.meta", { n: todayWorkout.exercises.length, min: estMin })}
              </p>

              {/* Pallini progressione ciclo */}
              <div className="mt-4 flex items-center gap-1.5">
                {days.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i < nextIndex
                        ? "w-6 bg-emerald-500"
                        : i === nextIndex
                          ? "w-9 bg-brand"
                          : "w-6 bg-white/15"
                    }`}
                  />
                ))}
              </div>

              {/* Anteprima primi esercizi */}
              <div className="mt-4 space-y-1.5">
                {todayWorkout.exercises.slice(0, 3).map((ex, i) => (
                  <div key={ex.id} className="flex items-center gap-3 rounded-2xl glass-dark px-3.5 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-xs font-bold text-[#ff6b61] tnum">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">{ex.exercise.name}</span>
                    <span className="text-xs text-white/50 tnum">
                      {ex.sets}×{ex.reps}{ex.weight != null ? ` · ${ex.weight}kg` : ""}
                    </span>
                  </div>
                ))}
                {todayWorkout.exercises.length > 3 && (
                  <p className="pl-1 text-xs text-white/40 tnum">
                    {t("dash.moreExercises", { n: todayWorkout.exercises.length - 3 })}
                  </p>
                )}
              </div>

              <StartWorkoutButton
                dayId={todayWorkout.id}
                dayName={todayWorkout.name}
                label={doneToday ? t("dash.startAgain") : t("dash.start")}
                className="mt-5 flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white shadow-cta transition-colors hover:bg-brand-hover"
              />
            </div>
          ) : (
            <div className="rounded-3xl glass p-8 text-center">
              <Dumbbell className="mx-auto h-8 w-8 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">{t("dash.noPlan")}</p>
              <p className="mt-1 text-sm text-slate-400">{t("dash.noPlanSub")}</p>
            </div>
          )}

          {/* Attività settimanale: anello + metriche + striscia giorni */}
          <div className="rounded-3xl glass p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">{t("dash.thisWeek")}</h2>
              <Link href="/client/progress" className="text-sm font-semibold text-brand">
                {t("dash.progress")} <ChevronRight className="inline h-3.5 w-3.5 -mt-0.5" />
              </Link>
            </div>
            <div className="flex items-center gap-5 sm:gap-8">
              <ActivityRing progress={weekGoal ? weekSessions.length / weekGoal : 0} size={124}>
                <span className="text-[26px] font-bold text-slate-900 leading-none tnum">
                  {weekSessions.length}
                  <span className="text-sm font-medium text-slate-400">/{weekGoal}</span>
                </span>
                <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {t("dash.workoutsLabel")}
                </span>
              </ActivityRing>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
                    <Flame className="h-4 w-4 text-orange-500" />
                  </span>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-slate-900 leading-none tnum">{weekCal}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t("dash.kcalBurned")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                    <Timer className="h-4 w-4 text-blue-500" />
                  </span>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-slate-900 leading-none tnum">
                      {weekMin}<span className="text-xs font-medium text-slate-400"> {t("dash.min")}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{t("dash.activeTime")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
                    <Flame className="h-4 w-4 text-brand" />
                  </span>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-slate-900 leading-none tnum">
                      {streak}<span className="text-xs font-medium text-slate-400"> {t("dash.days")}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{t("dash.streak")}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <WeekStrip days={strip} />
            </div>
          </div>
        </div>

        {/* ── Colonna laterale ── */}
        <div className="space-y-4">
          {/* Widget rapidi */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/client/medals" className="rounded-3xl glass p-4 transition-shadow hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 mb-2">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 leading-none tnum">{unlockedMedals}</p>
              <p className="text-xs text-slate-500 mt-1">{t("nav.medals")}</p>
            </Link>
            <WeightWidget currentWeight={lastWeight ?? null} />
            <Link href="/client/workout" className="rounded-3xl glass p-4 transition-shadow hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 mb-2">
                <Dumbbell className="h-4 w-4 text-brand" />
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{t("nav.myPlan")}</p>
              <p className="text-xs text-slate-500 mt-1 truncate">{activePlan?.name ?? "—"}</p>
            </Link>
            <Link href="/client/shop" className="rounded-3xl glass p-4 transition-shadow hover:shadow-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 mb-2">
                <ShoppingBag className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{t("nav.shop")}</p>
              <p className="text-xs text-slate-500 mt-1">{t("dash.shopSub")}</p>
            </Link>
          </div>

          {/* Trainer */}
          <div className="rounded-3xl glass p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400 mb-3">
              {t("dash.yourTrainer")}
            </p>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={profile.trainer.user.avatarUrl ?? undefined} />
                <AvatarFallback>{profile.trainer.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-900 truncate">{profile.trainer.user.name}</p>
                <p className="text-xs text-slate-400 truncate">{profile.trainer.user.email}</p>
              </div>
            </div>
            <Link
              href="/client/messages"
              className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-white/80 text-sm font-semibold text-slate-900 hover:bg-white"
            >
              <MessageSquare className="h-4 w-4" /> {t("dash.writeTrainer")}
            </Link>
          </div>

          {/* Raccomandazioni */}
          {recommendations.length > 0 && (
            <div className="rounded-3xl glass p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400 mb-3">
                {t("dash.recommended")}
              </p>
              <div className="space-y-2">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    href={`/client/shop?p=${rec.product.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 hover:bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{rec.product.name}</p>
                      <p className="text-xs text-slate-400 tnum">€{rec.product.salePrice.toFixed(2)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
