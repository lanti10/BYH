"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Dumbbell, BarChart3, MessageSquare, Users, Trophy, ShoppingBag,
  User, UserCog, TrendingUp, Gift, Package, Network, Settings, LayoutGrid, X, Activity,
} from "lucide-react";
import { useT } from "@/lib/i18n/client";

type Item = { href: string; label: string; icon: typeof Home; exact?: boolean; badge?: boolean };

// Barra inferiore = navigazione completa (niente più hamburger).
// 4 destinazioni principali + "Altro" che apre un pannello con le restanti.
const NAV: Record<"trainer" | "client" | "admin", { primary: Item[]; more: Item[] }> = {
  client: {
    primary: [
      { href: "/client", label: "dash.today", icon: Home, exact: true },
      { href: "/client/workout", label: "nav.workouts", icon: Dumbbell },
      { href: "/client/progress", label: "nav.progress", icon: BarChart3 },
      { href: "/client/shop", label: "nav.shop", icon: ShoppingBag },
    ],
    more: [
      { href: "/client/medals", label: "nav.medals", icon: Trophy },
      { href: "/client/messages", label: "nav.messages", icon: MessageSquare, badge: true },
      { href: "/client/profile", label: "nav.profile", icon: User },
    ],
  },
  trainer: {
    primary: [
      { href: "/trainer", label: "dash.today", icon: Home, exact: true },
      // Clienti = inbox stile WhatsApp: mostra qui il badge dei messaggi non letti
      { href: "/trainer/clients", label: "nav.clients", icon: Users, badge: true },
      { href: "/trainer/workouts", label: "nav.workouts", icon: Dumbbell },
      { href: "/trainer/my-workout", label: "nav.myWorkout", icon: Activity },
    ],
    more: [
      { href: "/trainer/products", label: "nav.products", icon: ShoppingBag },
      { href: "/trainer/earnings", label: "nav.earnings", icon: TrendingUp },
      { href: "/trainer/referral", label: "nav.network", icon: Gift },
      { href: "/trainer/profile", label: "nav.profile", icon: UserCog },
    ],
  },
  admin: {
    primary: [
      { href: "/admin", label: "dash.today", icon: Home, exact: true },
      { href: "/admin/users", label: "nav.users", icon: Users },
      { href: "/admin/products", label: "nav.catalog", icon: Package },
      { href: "/admin/sales", label: "nav.sales", icon: TrendingUp },
    ],
    more: [
      { href: "/admin/network", label: "nav.trainerNetwork", icon: Network },
      { href: "/admin/settings", label: "nav.settings", icon: Settings },
    ],
  },
};

function isActive(pathname: string, item: Item): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

export function TabBar({ role }: { role: "trainer" | "client" | "admin" }) {
  const pathname = usePathname();
  const { t } = useT();
  const { primary, more } = NAV[role];
  const [sheet, setSheet] = useState(false);
  const [unread, setUnread] = useState(0);

  // Messaggi non letti (badge) — la sidebar mobile non c'è più
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/messages/unread", { cache: "no-store" });
        if (res.ok && alive) setUnread((await res.json()).count ?? 0);
      } catch {
        /* offline */
      }
    };
    poll();
    const id = setInterval(poll, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pathname]);

  // Chiudi il pannello quando cambia pagina
  useEffect(() => setSheet(false), [pathname]);

  const moreActive = more.some((m) => isActive(pathname, m));
  // Messaggi ora vive in "Altro" per il cliente: mostra il badge sul tasto Altro
  const moreUnread = more.some((m) => m.badge) && unread > 0;

  return (
    <>
      {/* Pannello "Altro" */}
      {sheet && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSheet(false)} />
          <div className="lg:hidden fixed bottom-[92px] left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md rounded-3xl glass-prominent p-3">
            <div className="flex items-center justify-between px-2 pb-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400">
                {t("nav.more")}
              </span>
              <button
                onClick={() => setSheet(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                aria-label={t("common.cancel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {more.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-colors hover:bg-white/60"
                  >
                    <span
                      className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${
                        active ? "bg-brand text-white shadow-cta" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.badge && unread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white tnum">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </span>
                    <span className={`text-xs ${active ? "font-semibold text-brand" : "font-medium text-slate-600"}`}>
                      {t(item.label)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Barra inferiore fissa */}
      <nav data-tabbar className="lg:hidden fixed bottom-4 left-1/2 z-40 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md">
        <div className="flex items-stretch justify-around rounded-[28px] glass-prominent px-1.5 py-2.5">
          {primary.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-1 flex-col items-center gap-0.5 py-0.5"
              >
                <Icon
                  className={`h-[22px] w-[22px] ${active ? "text-brand" : "text-slate-400"}`}
                  strokeWidth={active ? 2.4 : 2}
                />
                {item.badge && unread > 0 && (
                  <span className="absolute top-0 right-[calc(50%-18px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white tnum">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
                <span className={`text-[10px] leading-tight ${active ? "font-semibold text-brand" : "font-medium text-slate-500"}`}>
                  {t(item.label)}
                </span>
              </Link>
            );
          })}

          {/* Altro */}
          <button
            onClick={() => setSheet((v) => !v)}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-0.5"
          >
            <LayoutGrid
              className={`h-[22px] w-[22px] ${moreActive || sheet ? "text-brand" : "text-slate-400"}`}
              strokeWidth={moreActive || sheet ? 2.4 : 2}
            />
            {moreUnread && !sheet && (
              <span className="absolute top-0 right-[calc(50%-18px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white tnum">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
            <span className={`text-[10px] leading-tight ${moreActive || sheet ? "font-semibold text-brand" : "font-medium text-slate-500"}`}>
              {t("nav.more")}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
