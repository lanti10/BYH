"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { moveClientToTrainer } from "./actions";

export function MoveClientForm({
  clientProfileId,
  trainers,
}: {
  clientProfileId: string;
  trainers: { id: string; name: string }[];
}) {
  const { t } = useT();
  const router = useRouter();
  const [selected, setSelected] = useState(trainers[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  if (trainers.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="min-h-11 rounded-full glass px-4 text-sm text-slate-700"
      >
        {trainers.map((tr) => (
          <option key={tr.id} value={tr.id}>
            {tr.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || !selected}
        onClick={() => {
          if (!confirm(t("adm.people.moveClientConfirm"))) return;
          startTransition(async () => {
            await moveClientToTrainer(clientProfileId, selected);
            router.refresh();
          });
        }}
        className="min-h-11 rounded-full glass px-5 text-sm font-medium text-slate-700 hover:bg-black/5 disabled:opacity-50"
      >
        {t("adm.people.move")}
      </button>
    </div>
  );
}
