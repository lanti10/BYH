import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgressChart } from "@/components/trainer/progress-chart";
import { Dumbbell, Flame, Timer, Heart, Activity } from "lucide-react";

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default async function ClientProgressPage() {
  const user = await requireRole("CLIENT");
  const client = user.clientProfile;

  if (!client) {
    return (
      <div className="p-4 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Progressi</h1>
        <p className="text-slate-400 mt-4 text-sm">In attesa del collegamento con un trainer.</p>
      </div>
    );
  }

  const [sessions, progressLogs] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { clientId: client.id },
      orderBy: { completedAt: "desc" },
      include: { workoutDay: true },
      take: 50,
    }),
    prisma.progressLog.findMany({
      where: { clientId: client.id },
      orderBy: { date: "asc" },
      take: 60,
    }),
  ]);

  const totalSessions = sessions.length;
  const totalMin = sessions.reduce((s, x) => s + (x.durationMin ?? 0), 0);
  const totalCal = sessions.reduce((s, x) => s + (x.calories ?? 0), 0);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = sessions.filter((s) => new Date(s.completedAt).getTime() >= weekAgo).length;

  const progressData = progressLogs.map((log) => ({
    date: log.date.toLocaleDateString("it-IT", { month: "short", day: "numeric" }),
    peso: log.weight,
    grasso: log.bodyFat,
  }));

  const stats = [
    { label: "Allenamenti", value: totalSessions, icon: Dumbbell, tint: "bg-[#D42B27]/10 text-[#D42B27]" },
    { label: "Questa settimana", value: thisWeek, icon: Activity, tint: "bg-emerald-500/10 text-emerald-600" },
    { label: "Tempo totale", value: fmtDuration(totalMin), icon: Timer, tint: "bg-blue-500/10 text-blue-600" },
    { label: "Calorie totali", value: totalCal, icon: Flame, tint: "bg-orange-500/10 text-orange-600" },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Progressi</h1>
        <p className="text-slate-500 mt-1">Le statistiche dei tuoi allenamenti.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint} mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">{value}</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Weight chart */}
      {progressData.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
          <h2 className="font-bold text-slate-900 mb-4">Andamento peso</h2>
          <ProgressChart data={progressData} />
        </div>
      )}

      {/* Storico sessioni */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-slate-900 mb-4">Allenamenti recenti</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-10">
            <Dumbbell className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">
              Nessun allenamento registrato. Avvia una sessione dalla tua scheda!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D42B27]/10">
                  <Dumbbell className="h-5 w-5 text-[#D42B27]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {s.workoutDay?.name || "Allenamento"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(s.completedAt).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
                  {s.durationMin != null && (
                    <span className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
                      <Timer className="h-3 w-3" /> {fmtDuration(s.durationMin)}
                    </span>
                  )}
                  {s.calories != null && (
                    <span className="flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                      <Flame className="h-3 w-3" /> {s.calories}
                    </span>
                  )}
                  {s.avgHeartRate != null && (
                    <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                      <Heart className="h-3 w-3" /> {s.avgHeartRate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
