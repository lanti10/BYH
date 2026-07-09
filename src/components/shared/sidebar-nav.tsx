"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { useT } from "@/lib/i18n/client";
import {
  LayoutDashboard, Users, Dumbbell, MessageSquare,
  ShoppingBag, TrendingUp, Gift, Package, Network, Settings, X, UserCog, Trophy,
} from "lucide-react";

const navConfig = {
  trainer: [
    { href: "/trainer", label: "nav.dashboard", icon: LayoutDashboard },
    { href: "/trainer/clients", label: "nav.clients", icon: Users },
    { href: "/trainer/workouts", label: "nav.workouts", icon: Dumbbell },
    { href: "/trainer/messages", label: "nav.messages", icon: MessageSquare },
    { href: "/trainer/products", label: "nav.products", icon: ShoppingBag },
    { href: "/trainer/earnings", label: "nav.earnings", icon: TrendingUp },
    { href: "/trainer/referral", label: "nav.network", icon: Gift },
    { href: "/trainer/profile", label: "nav.profile", icon: UserCog },
  ],
  client: [
    { href: "/client", label: "nav.dashboard", icon: LayoutDashboard },
    { href: "/client/workout", label: "nav.myPlan", icon: Dumbbell },
    { href: "/client/progress", label: "nav.progress", icon: TrendingUp },
    { href: "/client/medals", label: "nav.medals", icon: Trophy },
    { href: "/client/messages", label: "nav.messages", icon: MessageSquare },
    { href: "/client/shop", label: "nav.shop", icon: ShoppingBag },
    { href: "/client/profile", label: "nav.profile", icon: UserCog },
  ],
  admin: [
    { href: "/admin", label: "nav.dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "nav.catalog", icon: Package },
    { href: "/admin/users", label: "nav.users", icon: Users },
    { href: "/admin/network", label: "nav.trainerNetwork", icon: Network },
    { href: "/admin/sales", label: "nav.sales", icon: TrendingUp },
    { href: "/admin/settings", label: "nav.settings", icon: Settings },
  ],
};

const roleLabel = {
  trainer: "role.trainer",
  client: "role.client",
  admin: "role.admin",
};

export function SidebarNav({
  role,
  open,
  onClose,
}: {
  role: "trainer" | "client" | "admin";
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { t } = useT();
  const items = navConfig[role];
  const [unread, setUnread] = useState(0);
  const prev = useRef(0);
  const initialized = useRef(false);

  // Richiedi il permesso notifiche una volta
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Polling messaggi non letti
  useEffect(() => {
    let activeFlag = true;
    async function poll() {
      try {
        const res = await fetch("/api/messages/unread", { cache: "no-store" });
        if (!res.ok || !activeFlag) return;
        const { count } = await res.json();
        if (initialized.current && count > prev.current) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("BYH · Nuovo messaggio", {
              body: "Hai ricevuto un nuovo messaggio.",
            });
          }
        }
        prev.current = count;
        initialized.current = true;
        setUnread(count);
      } catch {
        /* offline */
      }
    }
    poll();
    const t = setInterval(poll, 8000);
    return () => {
      activeFlag = false;
      clearInterval(t);
    };
  }, [pathname]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 hidden lg:flex h-screen w-64 flex-col bg-depth-dark text-white transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl shadow-cta">
          <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base tracking-tight leading-tight">Build Your Health</p>
          <p className="text-[11px] font-medium uppercase tracking-[1.2px] text-white/50">{t(roleLabel[role])}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Chiudi menu"
          className="flex h-9 w-9 items-center justify-center rounded-full glass-dark hover:bg-white/15 shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const showBadge = item.href.endsWith("/messages") && unread > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors",
                isActive
                  ? "glass-dark-prominent font-semibold text-white"
                  : "font-medium text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-brand")} />
              <span className="flex-1">{t(item.label)}</span>
              {showBadge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white tnum">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <p className="text-xs text-white/50">{t("nav.account")}</p>
        </div>
      </div>
    </aside>
  );
}
