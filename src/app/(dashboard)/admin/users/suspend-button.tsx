"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { toggleSuspended } from "./actions";

export function SuspendButton({ userId, suspended }: { userId: string; suspended: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!suspended && !confirm(t("adm.people.confirmSuspend"))) return;
        startTransition(async () => {
          await toggleSuspended(userId);
          router.refresh();
        });
      }}
      className="min-h-11 rounded-full glass px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-black/5 disabled:opacity-50"
    >
      {t(suspended ? "adm.people.reactivate" : "adm.people.suspend")}
    </button>
  );
}
