"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BarChart3, User, Users, MessageSquare } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// Tab bar mobile dal design system BYH Pulse (§04): pillola glass, voce attiva rossa.
const tabs = {
  client: [
    { href: "/client", label: "dash.today", icon: Home, exact: true },
    { href: "/client/workout", label: "nav.workouts", icon: Dumbbell },
    { href: "/client/progress", label: "nav.progress", icon: BarChart3 },
    { href: "/client/profile", label: "nav.profile", icon: User },
  ],
  trainer: [
    { href: "/trainer", label: "dash.today", icon: Home, exact: true },
    { href: "/trainer/clients", label: "nav.clients", icon: Users },
    { href: "/trainer/workouts", label: "nav.workouts", icon: Dumbbell },
    { href: "/trainer/messages", label: "nav.messages", icon: MessageSquare },
  ],
  admin: [
    { href: "/admin", label: "dash.today", icon: Home, exact: true },
    { href: "/admin/users", label: "nav.users", icon: Users },
    { href: "/admin/sales", label: "nav.sales", icon: BarChart3 },
    { href: "/admin/settings", label: "nav.profile", icon: User },
  ],
} as const;

export function TabBar({ role }: { role: "trainer" | "client" | "admin" }) {
  const pathname = usePathname();
  const { t } = useT();
  const items = tabs[role];

  return (
    <nav className="lg:hidden fixed bottom-4 left-1/2 z-40 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-md">
      <div className="flex items-center justify-around rounded-[28px] glass-prominent px-2 py-3">
        {items.map((item) => {
          const isActive = ("exact" in item && item.exact)
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-14 flex-col items-center gap-0.5"
            >
              <Icon
                className={`h-[22px] w-[22px] ${isActive ? "text-brand" : "text-slate-400"}`}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                className={`text-[10px] ${
                  isActive ? "font-semibold text-brand" : "font-medium text-slate-500"
                }`}
              >
                {t(item.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
