import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { Users, Network, Activity, TrendingUp, Package, Settings, ChevronRight } from "lucide-react";

// Polso della piattaforma. Per ora: i numeri che si ottengono con quattro conteggi,
// più la mappa delle aree. Gli allarmi veri (PT senza clienti, clienti fermi,
// ritenzione) arrivano quando svilupperemo questa zona.

const AREAS = [
  { href: "/admin/users", label: "adm.people", sub: "adm.peopleSub", icon: Users },
  { href: "/admin/network", label: "adm.network", sub: "adm.networkSub", icon: Network },
  { href: "/admin/activity", label: "adm.activity", sub: "adm.activitySub", icon: Activity },
  { href: "/admin/sales", label: "adm.commerce", sub: "adm.commerceSub", icon: TrendingUp },
  { href: "/admin/products", label: "adm.catalog", sub: "adm.catalogSub", icon: Package },
  { href: "/admin/settings", label: "adm.system", sub: "adm.systemSub", icon: Settings },
];

export default async function AdminDashboard() {
  await requireRole("ADMIN");
  const { t } = await getT();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [trainers, clients, sessionsToday, newThisWeek] = await Promise.all([
    prisma.trainerProfile.count(),
    prisma.clientProfile.count(),
    prisma.workoutSession.count({ where: { completedAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  const stats = [
    { label: t("adm.trainers"), value: trainers },
    { label: t("adm.clients"), value: clients },
    { label: t("adm.sessionsToday"), value: sessionsToday },
    { label: t("adm.newThisWeek"), value: newThisWeek },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">{t("adm.pulse")}</h1>
        <p className="mt-1 text-slate-500">{t("adm.pulseSub")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl glass p-5">
            <p className="text-[32px] font-bold leading-none text-slate-900 tnum">{s.value}</p>
            <p className="mt-2 text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 px-1 font-semibold text-slate-900">{t("adm.areas")}</h2>
        {/* grid-cols-1 esplicito: una colonna implicita ha min-width auto e si
            allarga sul testo lungo invece di troncarlo, facendo scorrere la pagina
            in orizzontale. Tailwind genera minmax(0, 1fr), che è il rimedio. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AREAS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex min-w-0 items-center gap-4 rounded-3xl glass p-5 transition-shadow hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-600" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">{t(a.label)}</span>
                  <span className="block truncate text-sm text-slate-400">{t(a.sub)}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
