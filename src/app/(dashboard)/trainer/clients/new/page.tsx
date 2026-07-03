import { requireRole } from "@/lib/auth";
import { ensureFriendlyReferralCode } from "@/lib/referral";
import { InviteHub } from "@/components/trainer/invite-hub";
import { AddClientForm } from "./add-client-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewClientPage() {
  const user = await requireRole("TRAINER");
  const trainer = user.trainerProfile!;
  const code = await ensureFriendlyReferralCode(trainer.id, trainer.referralCode);

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/trainer/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Clienti
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Aggiungi cliente</h1>
        <p className="text-slate-500 mt-1">
          Invita un nuovo cliente o collega chi è già registrato.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800">1. Invita con QR o link</h2>
          <p className="text-sm text-slate-500 mt-1">
            Fai scansionare il QR o condividi il link: chi crea l&apos;account viene collegato automaticamente a te.
          </p>
        </div>
        <InviteHub code={code} defaultTab="client" />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800">2. Collega un cliente già registrato</h2>
          <p className="text-sm text-slate-500 mt-1">
            Inserisci l&apos;email con cui si è registrato su BYH.
          </p>
        </div>
        <div className="rounded-2xl glass p-5">
          <AddClientForm />
        </div>
      </section>
    </div>
  );
}
