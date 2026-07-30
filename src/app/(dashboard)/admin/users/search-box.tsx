"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// Ricerca "live": ogni digitazione (anche cancellare tutto) aggiorna l'URL dopo
// un breve debounce, senza serve un pulsante invio. Prima era un <form> che si
// aggiornava solo premendo Invio: cancellare il testo senza inviare lasciava la
// lista ferma sul filtro precedente.
export function SearchBox({ initialQ }: { initialQ: string }) {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQ);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("adm.people.search")}
        className="w-full rounded-full glass py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
    </div>
  );
}
