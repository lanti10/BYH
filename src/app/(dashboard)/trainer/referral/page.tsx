import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { ensureFriendlyReferralCode } from "@/lib/referral";
import { InviteHub } from "@/components/trainer/invite-hub";
import { Users, UserPlus } from "lucide-react";

export default async function ReferralPage() {
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;

  const code = await ensureFriendlyReferralCode(trainer.id, trainer.referralCode);

  const [clientCount, trainerReferrals] = await Promise.all([
    prisma.clientProfile.count({ where: { trainerId: trainer.id } }),
    prisma.trainerProfile.count({ where: { referredById: trainer.id } }),
  ]);

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("nav.network")}</h1>
        <p className="text-slate-500 mt-1">
          {t("ref.sub")}
        </p>
      </div>

      <InviteHub code={code} />

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl glass p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 mb-3">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{clientCount}</p>
          <p className="text-sm text-slate-500">{t("ref.linked")}</p>
        </div>
        <div className="rounded-2xl glass p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 mb-3">
            <UserPlus className="h-5 w-5 text-brand" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{trainerReferrals}</p>
          <p className="text-sm text-slate-500">{t("ref.invited")}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
        <p className="font-semibold text-slate-800 mb-2">{t("ref.how")}</p>
        <ol className="space-y-2 text-sm text-slate-500 list-decimal list-inside">
          <li>{t("ref.s1")}</li>
          <li>{t("ref.s2")}</li>
          <li>{t("ref.s3")}</li>
        </ol>
      </div>
    </div>
  );
}
