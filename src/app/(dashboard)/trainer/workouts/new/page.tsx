import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkoutBuilder } from "./workout-builder";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewWorkoutPage() {
  const user = await requireRole("TRAINER");
  const trainer = user.trainerProfile!;

  const clientProfiles = await prisma.clientProfile.findMany({
    where: { trainerId: trainer.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const clients = clientProfiles.map((c) => ({
    id: c.id,
    name: c.user.name || c.user.email,
  }));

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/trainer/workouts"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Schede
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nuova scheda</h1>
        <p className="text-slate-500 mt-1">
          Crea un programma di allenamento per il tuo cliente, giorno per giorno.
        </p>
      </div>

      <WorkoutBuilder clients={clients} />
    </div>
  );
}
