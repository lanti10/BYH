import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { AccountSettings } from "@/components/shared/account-settings";
import { ClientProfileFields } from "@/components/client/client-profile-fields";

function ageFromBirth(birth?: Date | null): number | null {
  if (!birth) return null;
  return Math.floor((Date.now() - new Date(birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function ClientProfilePage() {
  const user = await requireRole("CLIENT");
  const { t } = await getT();
  const c = user.clientProfile;

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("nav.profile")}</h1>
        <p className="text-slate-500 mt-1">{t("profile.subClient")}</p>
      </div>

      <AccountSettings />

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">{t("profile.trainingData")}</h2>
        <ClientProfileFields
          submitLabel={t("wb.saveEdits")}
          initial={{
            sex: c?.sex ?? undefined,
            age: ageFromBirth(c?.birthDate),
            height: c?.height ?? null,
            weight: c?.startWeight ?? null,
            days: c?.trainingDaysPerWeek ?? null,
            goals: c?.goals ?? [],
            notes: c?.notes ?? null,
          }}
        />
      </div>
    </div>
  );
}
