"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";

export function DashboardShell({
  role,
  children,
}: {
  role: "trainer" | "client" | "admin";
  children: React.ReactNode;
}) {
  // Chiuso di default (mobile-first); su desktop si apre dopo il mount
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1024) setOpen(true);
  }, []);

  return (
    <div
      className="flex flex-col"
      style={{ height: "var(--app-height, 100dvh)" }}
    >
      {/* Top bar mobile con hamburger — nero pieno, il rosso resta solo per accenti */}
      <header className="flex items-center gap-3 px-4 h-14 bg-ink text-white shrink-0 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
          className="flex h-11 w-11 -ml-2 items-center justify-center rounded-full hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="relative h-8 w-8 overflow-hidden rounded-lg shrink-0">
          <Image src="/byh-logo.jpg" alt="BYH" fill className="object-cover" />
        </div>
        <span className="font-semibold tracking-tight truncate">Build Your Health</span>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop scuro su mobile quando il menu è aperto */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Pulsante per riaprire su desktop quando la sidebar è chiusa */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Apri menu"
            className="hidden lg:flex fixed top-4 left-4 z-30 h-11 w-11 items-center justify-center rounded-full bg-ink text-white shadow-lg hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <SidebarNav role={role} open={open} onClose={() => setOpen(false)} />

        <main
          className={cn(
            "flex-1 overflow-y-auto bg-depth-light transition-all duration-300",
            open ? "lg:ml-64" : "ml-0"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
