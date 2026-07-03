"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ClientProfileFields } from "@/components/client/client-profile-fields";

export function ProfileSetupForm({ firstName }: { firstName: string }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-depth-dark px-4 pt-10 pb-16 text-center text-white">
        <div className="relative mx-auto h-16 w-16 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
          <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Ciao {firstName}!</h1>
        <p className="mt-1 text-white/80 text-sm max-w-sm mx-auto">
          Completa il tuo profilo: servirà al tuo trainer per crearti una scheda su misura.
        </p>
      </div>

      <div className="mx-auto -mt-10 max-w-lg px-4 pb-12">
        <ClientProfileFields
          submitLabel="Completa profilo"
          onSaved={() => {
            router.push("/client");
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
