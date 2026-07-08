import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import { TrainerProfileCard } from "@/components/trainer/trainer-profile-card";

export default async function TrainerProfilePage() {
  const user = await requireRole("TRAINER");
  const { t, locale } = await getT();
  const trainer = user.trainerProfile!;

  const clientCount = await prisma.clientProfile.count({ where: { trainerId: trainer.id } });
  const memberSince = user.createdAt.toLocaleDateString(DATE_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("nav.profile")}</h1>
        <p className="text-slate-500 mt-1">{t("profile.subTrainer")}</p>
      </div>

      <TrainerProfileCard
        referralCode={trainer.referralCode}
        clientCount={clientCount}
        memberSince={memberSince}
      />
    </div>
  );
}
