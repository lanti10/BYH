import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { ensureFriendlyReferralCode } from "@/lib/referral";
import { InviteHub } from "@/components/trainer/invite-hub";
import { AddClientForm } from "./add-client-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewClientPage() {
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;
  const code = await ensureFriendlyReferralCode(trainer.id, trainer.referralCode);

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/trainer/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> {t("nav.clients")}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{t("tr.addClient")}</h1>
        <p className="text-slate-500 mt-1">
          {t("nc.sub")}
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800">{t("nc.s1")}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {t("nc.s1sub")}
          </p>
        </div>
        <InviteHub code={code} defaultTab="client" />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800">{t("nc.s2")}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {t("nc.s2sub")}
          </p>
        </div>
        <div className="rounded-2xl glass p-5">
          <AddClientForm />
        </div>
      </section>
    </div>
  );
}
