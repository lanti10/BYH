import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureFriendlyReferralCode } from "@/lib/referral";
import { InviteHub } from "@/components/trainer/invite-hub";
import { Users, UserPlus } from "lucide-react";

export default async function ReferralPage() {
  const user = await requireRole("TRAINER");
  const trainer = user.trainerProfile!;

  const code = await ensureFriendlyReferralCode(trainer.id, trainer.referralCode);

  const [clientCount, trainerReferrals] = await Promise.all([
    prisma.clientProfile.count({ where: { trainerId: trainer.id } }),
    prisma.trainerProfile.count({ where: { referredById: trainer.id } }),
  ]);

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rete / Inviti</h1>
        <p className="text-slate-500 mt-1">
          Condividi il tuo codice: chi si registra con questo link viene collegato automaticamente a te.
        </p>
      </div>

      <InviteHub code={code} />

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 mb-3">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{clientCount}</p>
          <p className="text-sm text-slate-500">Clienti collegati</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D42B27]/10 mb-3">
            <UserPlus className="h-5 w-5 text-[#D42B27]" />
          </div>
          <p className="text-3xl font-black text-slate-900">{trainerReferrals}</p>
          <p className="text-sm text-slate-500">Trainer invitati</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
        <p className="font-semibold text-slate-800 mb-2">Come funziona</p>
        <ol className="space-y-2 text-sm text-slate-500 list-decimal list-inside">
          <li>Condividi il tuo codice o link con un cliente.</li>
          <li>Il cliente crea l&apos;account tramite il link (o inserisce il codice in fase di registrazione).</li>
          <li>Viene collegato automaticamente a te e appare nella tua lista clienti.</li>
        </ol>
      </div>
    </div>
  );
}
