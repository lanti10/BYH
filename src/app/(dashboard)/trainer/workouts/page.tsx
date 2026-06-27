import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, Dumbbell, CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default async function WorkoutsPage() {
  const user = await requireRole("TRAINER");
  const trainer = user.trainerProfile!;

  const plans = await prisma.workoutPlan.findMany({
    where: { trainerId: trainer.id },
    include: {
      client: { include: { user: true } },
      workouts: { include: { _count: { select: { exercises: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schede</h1>
          <p className="text-slate-500 mt-1">
            {plans.length} {plans.length === 1 ? "scheda creata" : "schede create"}
          </p>
        </div>
        <Link
          href="/trainer/workouts/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#D42B27] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b8231f]"
        >
          <Plus className="h-4 w-4" /> Crea scheda
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D42B27]/10">
            <Dumbbell className="h-7 w-7 text-[#D42B27]" />
          </div>
          <p className="text-lg font-semibold text-slate-700">Nessuna scheda ancora</p>
          <p className="mt-1 text-sm text-slate-400">Crea la prima scheda per un tuo cliente.</p>
          <Link
            href="/trainer/workouts/new"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Crea scheda
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const totalExercises = plan.workouts.reduce((s, w) => s + w._count.exercises, 0);
            const days = [...plan.workouts].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
            return (
              <Link
                key={plan.id}
                href={`/trainer/clients/${plan.clientId}`}
                className="group rounded-3xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{plan.name}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {plan.client.user.name || plan.client.user.email}
                    </p>
                  </div>
                  {plan.isActive && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                      Attiva
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" /> {plan.workouts.length} giorni
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Dumbbell className="h-4 w-4" /> {totalExercises} esercizi
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {days.map((w) => (
                    <span
                      key={w.id}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                    >
                      {WEEKDAYS[w.dayOfWeek]}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-end text-sm font-medium text-[#D42B27] opacity-0 transition-opacity group-hover:opacity-100">
                  Apri cliente <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
