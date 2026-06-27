import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanDayTabs, type PlanDay } from "@/components/shared/plan-day-tabs";
import { Dumbbell } from "lucide-react";

export default async function ClientWorkoutPage() {
  const user = await requireRole("CLIENT");
  const client = user.clientProfile;

  const plan = client
    ? await prisma.workoutPlan.findFirst({
        where: { clientId: client.id, isActive: true },
        orderBy: { createdAt: "desc" },
        include: {
          workouts: {
            orderBy: { dayOfWeek: "asc" },
            include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
          },
        },
      })
    : null;

  if (!plan) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">La mia scheda</h1>
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D42B27]/10">
            <Dumbbell className="h-7 w-7 text-[#D42B27]" />
          </div>
          <p className="text-lg font-semibold text-slate-700">Nessuna scheda attiva</p>
          <p className="mt-1 text-sm text-slate-400">
            Il tuo trainer non ti ha ancora assegnato una scheda.
          </p>
        </div>
      </div>
    );
  }

  const days: PlanDay[] = plan.workouts.map((w) => ({
    id: w.id,
    name: w.name,
    exercises: w.exercises.map((e) => ({
      id: e.id,
      name: e.exercise.name,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      restSeconds: e.restSeconds,
    })),
  }));

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">{plan.name}</h1>
      <p className="text-slate-500 mt-1 mb-6 text-sm">
        {plan.durationWeeks ? `Programma di ${plan.durationWeeks} settimane · ` : ""}
        Seleziona il giorno per vedere gli esercizi da svolgere.
      </p>
      {plan.description && (
        <p className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600 mb-6">
          {plan.description}
        </p>
      )}
      <PlanDayTabs days={days} startHrefBase="/workout-session" />
    </div>
  );
}
