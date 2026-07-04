"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ClientProfileFields } from "@/components/client/client-profile-fields";
import { useT } from "@/lib/i18n/client";

export function ProfileSetupForm({ firstName }: { firstName: string }) {
  const router = useRouter();
  const { t } = useT();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-depth-dark px-4 pt-10 pb-16 text-center text-white">
        <div className="relative mx-auto h-16 w-16 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
          <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">{t("setup.hi", { name: firstName })}</h1>
        <p className="mt-1 text-white/80 text-sm max-w-sm mx-auto">
          {t("setup.sub")}
        </p>
      </div>

      <div className="mx-auto -mt-10 max-w-lg px-4 pb-12">
        <ClientProfileFields
          submitLabel={t("setup.submit")}
          onSaved={() => {
            router.push("/client");
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
