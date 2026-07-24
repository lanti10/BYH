import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { WorkoutBuilder } from "@/app/(dashboard)/trainer/workouts/new/workout-builder";
import { createOwnWorkoutPlan } from "@/app/(dashboard)/client/actions";

// Il cliente si crea la scheda da solo. Disponibile a tutti i clienti.
export default async function ClientNewWorkoutPage() {
  const user = await requireRole("CLIENT");
  const { t } = await getT();
  const client = user.clientProfile;

  if (!client) redirect("/client");

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("own.title")}</h1>
        <p className="mt-1 text-slate-500">{t("own.sub")}</p>
      </div>

      <WorkoutBuilder
        clients={[{ id: client.id, name: user.name || t("nav.myPlan") }]}
        initialClientId={client.id}
        hideClientSelect
        redirectTo="/client/workout"
        createAction={createOwnWorkoutPlan}
      />
    </div>
  );
}
