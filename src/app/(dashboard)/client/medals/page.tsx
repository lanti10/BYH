import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMedals } from "@/lib/medals";
import { MedalBadge } from "@/components/client/medal-badge";
import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";

export default async function MedalsPage() {
  const user = await requireRole("CLIENT");
  const client = user.clientProfile;

  const sessions = client
    ? await prisma.workoutSession.findMany({
        where: { clientId: client.id },
        select: { completedAt: true },
        take: 400,
      })
    : [];

  const weeklyGoal = client?.trainingDaysPerWeek ?? 3;
  const medals = computeMedals(sessions, weeklyGoal);
  const unlocked = medals.filter((m) => m.unlocked);
  const locked = medals.filter((m) => !m.unlocked);

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/client/progress"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Progressi
        </Link>
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Medagliere</h1>
        <p className="text-slate-500 mt-1 text-sm tnum">
          {unlocked.length} di {medals.length} medaglie sbloccate
        </p>
      </div>

      {/* Vetrina trofei */}
      <div className="rounded-3xl bg-depth-dark p-6 text-white text-center">
        <Trophy className="mx-auto h-8 w-8 text-[#FFD60A] mb-2" />
        <p className="text-4xl font-bold tnum">{unlocked.length}</p>
        <p className="text-sm text-white/50 mt-1">traguardi raggiunti</p>
      </div>

      {unlocked.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400 mb-4">
            Sbloccate
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {unlocked.map((m) => (
              <MedalBadge key={m.id} medal={m} size={80} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400 mb-4">
          Da conquistare
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {locked.map((m) => (
            <MedalBadge key={m.id} medal={m} size={80} />
          ))}
        </div>
      </div>

      {/* Legenda traguardi */}
      <div className="rounded-3xl glass p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Come si sbloccano</h2>
        <div className="space-y-2.5">
          {medals.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: m.unlocked ? m.color : "#C7C7CC" }}
              />
              <span className={`text-sm ${m.unlocked ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                {m.title}
              </span>
              <span className="ml-auto text-xs text-slate-400 text-right">{m.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
