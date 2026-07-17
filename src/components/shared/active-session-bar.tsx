"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { elapsedSec, fmtDuration, readActiveSession, type StoredSession } from "@/lib/session-store";

// Barra "allenamento in corso": compare in tutta l'app quando la tendina del
// tracker è abbassata. Toccandola si rialza la tendina e si torna all'allenamento.
// Il tempo mostrato è quello reale (dai timestamp), non un conteggio locale.
export function ActiveSessionBar({ onOpen }: { onOpen: () => void }) {
  const { t } = useT();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [sec, setSec] = useState(0);

  useEffect(() => {
    const sync = () => {
      const cur = readActiveSession();
      setSession(cur);
      setSec(cur ? elapsedSec(cur) : 0);
    };
    sync();
    const id = setInterval(sync, 1000);
    const onVisible = () => {
      if (!document.hidden) sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!session) return null;

  const paused = session.runningSince == null;

  return (
    <button
      data-session-bar
      onClick={onOpen}
      className="fixed bottom-24 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-full bg-depth-dark px-4 py-3 text-left text-white shadow-lg lg:bottom-4"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {!paused && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            paused ? "bg-white/40" : "bg-emerald-400"
          }`}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">
          {session.dayName || t("session.workout")}
        </p>
        <p className="text-[11px] leading-tight text-white/50">
          {paused ? t("session.paused") : t("session.inProgress")}
        </p>
      </div>

      <span className="shrink-0 text-base font-bold tnum">{fmtDuration(sec)}</span>
      <ChevronUp className="h-4 w-4 shrink-0 text-white/40" />
    </button>
  );
}
