"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Check, MessageSquare, Moon, Sun } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n/dict";
import { useT, writeLocaleCookie } from "@/lib/i18n/client";
import { usePush } from "@/lib/use-push";

type Notif = {
  id: string;
  senderId: string;
  senderName: string;
  preview: string;
  createdAt: string;
};

function timeAgo(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (min < 60) return rtf.format(-min, "minute");
  const h = Math.floor(min / 60);
  if (h < 24) return rtf.format(-h, "hour");
  return rtf.format(-Math.floor(h / 24), "day");
}

export function HeaderActions({
  role,
  dark = false,
}: {
  role: "trainer" | "client" | "admin";
  dark?: boolean; // true se su sfondo scuro (top bar mobile)
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const [open, setOpen] = useState<"none" | "notif" | "lang">("none");
  const [items, setItems] = useState<Notif[]>([]);
  const [count, setCount] = useState(0);
  const [marking, setMarking] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const push = usePush();

  // Allinea lo stato del pulsante al tema effettivo (impostato dallo script anti-flash)
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("byh-theme", next ? "dark" : "light");
    } catch {
      /* storage non disponibile */
    }
    setIsDark(next);
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setCount(data.count);
      }
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  // Chiudi cliccando fuori
  useEffect(() => {
    if (open === "none") return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen("none");
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  async function markAllRead() {
    setMarking(true);
    try {
      await fetch("/api/notifications", { method: "POST" });
      await load();
      router.refresh();
    } finally {
      setMarking(false);
    }
  }

  function openChat(n: Notif) {
    setOpen("none");
    router.push(role === "trainer" ? `/trainer/messages?c=${n.senderId}` : "/client/messages");
  }

  function pickLocale(l: Locale) {
    writeLocaleCookie(l);
    setOpen("none");
    router.refresh();
    // ricarica per aggiornare anche i componenti client già montati
    window.location.reload();
  }

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const btnCls = dark
    ? "relative flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10"
    : "relative flex h-11 w-11 items-center justify-center rounded-full glass text-slate-700 hover:bg-white";

  return (
    <div ref={rootRef} className="relative flex items-center gap-1">
      {/* Campanella notifiche */}
      <button
        onClick={() => setOpen(open === "notif" ? "none" : "notif")}
        aria-label={t("notif.title")}
        className={btnCls}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white tnum">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Tema chiaro/scuro */}
      <button onClick={toggleTheme} aria-label={t("theme.toggle")} className={btnCls}>
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Selettore lingua */}
      <button
        onClick={() => setOpen(open === "lang" ? "none" : "lang")}
        aria-label={t("lang.title")}
        className={btnCls}
      >
        <span className="text-lg leading-none">{current.flag}</span>
      </button>

      {/* Pannello notifiche */}
      {open === "notif" && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,340px)] overflow-hidden rounded-3xl glass-prominent shadow-xl">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="font-semibold text-slate-900">{t("notif.title")}</p>
            {count > 0 && (
              <button
                onClick={markAllRead}
                disabled={marking}
                className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-cta hover:bg-brand-hover disabled:opacity-60"
              >
                <Check className="h-3 w-3" strokeWidth={3} /> {t("notif.markRead")}
              </button>
            )}
          </div>

          {/* Attiva notifiche push sul telefono (gesto richiesto su iOS) */}
          {push.supported && push.permission === "default" && (
            <button
              onClick={push.enable}
              disabled={push.busy}
              className="mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-2 rounded-2xl bg-brand/10 px-3 py-2.5 text-left text-sm font-semibold text-brand hover:bg-brand/15 disabled:opacity-60"
            >
              <BellRing className="h-4 w-4 shrink-0" />
              <span className="flex-1">{t("notif.enable")}</span>
            </button>
          )}
          {push.supported && push.permission === "denied" && (
            <p className="mx-4 mb-2 text-xs text-slate-400">{t("notif.blocked")}</p>
          )}

          <div className="max-h-[55vh] overflow-y-auto px-2 pb-2">
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto h-6 w-6 text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">{t("notif.empty")}</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openChat(n)}
                  className="flex w-full items-start gap-3 rounded-2xl p-3 text-left hover:bg-white/70"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900 truncate">
                      {t("notif.newMessage", { name: n.senderName })}
                    </span>
                    <span className="block text-xs text-slate-500 truncate">{n.preview}</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      {timeAgo(n.createdAt, locale)}
                    </span>
                  </span>
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pannello lingua */}
      {open === "lang" && (
        <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-3xl glass-prominent shadow-xl p-2">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400">
            {t("lang.title")}
          </p>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => pickLocale(l.code)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm hover:bg-white/70 ${
                l.code === locale ? "font-semibold text-slate-900" : "text-slate-600"
              }`}
            >
              <span className="text-lg leading-none">{l.flag}</span>
              <span className="flex-1 text-left">{l.label}</span>
              {l.code === locale && <Check className="h-4 w-4 text-brand" strokeWidth={3} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
