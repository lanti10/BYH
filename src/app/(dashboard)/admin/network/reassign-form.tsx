"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { reassignUpline } from "./actions";

export function ReassignForm({
  trainerId,
  currentParentId,
  options,
}: {
  trainerId: string;
  currentParentId: string | null;
  options: { id: string; name: string }[];
}) {
  const { t } = useT();
  const router = useRouter();
  const [selected, setSelected] = useState<string>(currentParentId ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="min-h-9 rounded-full glass px-3 text-xs text-slate-700"
      >
        <option value="">{t("adm.network.makeRoot")}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || selected === (currentParentId ?? "")}
        onClick={() => {
          if (!confirm(t("adm.network.reassignConfirm"))) return;
          startTransition(async () => {
            await reassignUpline(trainerId, selected || null);
            router.refresh();
          });
        }}
        className="min-h-9 rounded-full glass px-4 text-xs font-medium text-slate-700 hover:bg-black/5 disabled:opacity-50"
      >
        {t("adm.network.reassign")}
      </button>
    </div>
  );
}
