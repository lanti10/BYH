"use client";

import { Construction } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// title/description accettano chiavi del dizionario (o testo libero come fallback)
export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { t } = useT();
  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{t(title)}</h1>
      <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/50 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
          <Construction className="h-7 w-7 text-brand" />
        </div>
        <p className="text-lg font-semibold text-slate-700">{t("soon.title")}</p>
        <p className="mt-1 max-w-sm text-sm text-slate-400">{t("soon.sub")}</p>
      </div>
    </div>
  );
}
