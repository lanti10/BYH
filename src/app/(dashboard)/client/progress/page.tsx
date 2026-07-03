import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgressView, type Sess } from "@/components/client/progress-view";
import { MedalBadge } from "@/components/client/medal-badge";
import { computeMedals } from "@/lib/medals";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

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

  const rawSessions = await prisma.workoutSession.findMany({
    where: { clientId: client.id },
    orderBy: { completedAt: "desc" },
    include: { workoutDay: true },
    take: 400,
  });

  const sessions: Sess[] = rawSessions.map((s) => ({
    id: s.id,
    date: s.completedAt.toISOString(),
    min: s.durationMin ?? 0,
    cal: s.calories ?? 0,
    hr: s.avgHeartRate,
    name: s.workoutDay?.name || "Allenamento",
  }));

  const weeklyGoal = client.trainingDaysPerWeek ?? 3;
  const medals = computeMedals(
    rawSessions.map((s) => ({ completedAt: s.completedAt })),
    weeklyGoal
  );
  const unlocked = medals.filter((m) => m.unlocked);
  const medalPreview = [...unlocked, ...medals.filter((m) => !m.unlocked)].slice(0, 4);

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Progressi</h1>
        <span className="text-sm text-slate-400 tnum">{unlocked.length}/{medals.length} medaglie</span>
      </div>

      <ProgressView sessions={sessions} weeklyGoal={weeklyGoal} />

      {/* Medagliere (anteprima) */}
      <Link
        href="/client/medals"
        className="block rounded-3xl glass p-5 sm:p-6 transition-shadow hover:shadow-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Medagliere</h2>
          <span className="text-sm font-semibold text-brand">
            Tutte <ChevronRight className="inline h-3.5 w-3.5 -mt-0.5" />
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {medalPreview.map((m) => (
            <MedalBadge key={m.id} medal={m} size={64} />
          ))}
        </div>
      </Link>
    </div>
  );
}
