import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { AccountSettings } from "@/components/shared/account-settings";

export default async function TrainerProfilePage() {
  await requireRole("TRAINER");
  const { t } = await getT();

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("nav.profile")}</h1>
        <p className="text-slate-500 mt-1">{t("profile.subTrainer")}</p>
      </div>
      <AccountSettings />
    </div>
  );
}
