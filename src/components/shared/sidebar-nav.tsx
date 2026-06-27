"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard, Users, Dumbbell, MessageSquare,
  ShoppingBag, TrendingUp, Gift, Package, Network, Settings, X,
} from "lucide-react";

const navConfig = {
  trainer: [
    { href: "/trainer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/trainer/clients", label: "Clienti", icon: Users },
    { href: "/trainer/workouts", label: "Schede", icon: Dumbbell },
    { href: "/trainer/messages", label: "Messaggi", icon: MessageSquare },
    { href: "/trainer/products", label: "Prodotti", icon: ShoppingBag },
    { href: "/trainer/earnings", label: "Guadagni", icon: TrendingUp },
    { href: "/trainer/referral", label: "Rete / Inviti", icon: Gift },
  ],
  client: [
    { href: "/client", label: "Dashboard", icon: LayoutDashboard },
    { href: "/client/workout", label: "La mia scheda", icon: Dumbbell },
    { href: "/client/progress", label: "Progressi", icon: TrendingUp },
    { href: "/client/messages", label: "Messaggi", icon: MessageSquare },
    { href: "/client/shop", label: "Shop", icon: ShoppingBag },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Catalogo Prodotti", icon: Package },
    { href: "/admin/users", label: "Utenti", icon: Users },
    { href: "/admin/network", label: "Rete Trainer", icon: Network },
    { href: "/admin/sales", label: "Vendite", icon: TrendingUp },
    { href: "/admin/settings", label: "Impostazioni", icon: Settings },
  ],
};

const roleLabel = {
  trainer: "Personal Trainer",
  client: "Cliente",
  admin: "Admin",
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
  const items = navConfig[role];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r bg-slate-950 text-white transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-[#D42B27]">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
          <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-base tracking-wide leading-tight">Build Your Health</p>
          <p className="text-xs text-white/70">{roleLabel[role]}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Chiudi menu"
          className="p-1 rounded-md hover:bg-white/10 shrink-0"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#D42B27] text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <p className="text-xs text-slate-400">Account</p>
        </div>
      </div>
    </aside>
  );
}
