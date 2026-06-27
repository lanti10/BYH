import { requireRole } from "@/lib/auth";
import { AccountSettings } from "@/components/shared/account-settings";

export default async function TrainerProfilePage() {
  await requireRole("TRAINER");

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profilo</h1>
        <p className="text-slate-500 mt-1">Gestisci la tua foto e il tuo nome.</p>
      </div>
      <AccountSettings />
    </div>
  );
}
