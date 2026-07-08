import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import { AccountSettings } from "@/components/shared/account-settings";
import { Mail, Ticket, Users, CalendarDays } from "lucide-react";

export default async function TrainerProfilePage() {
  const user = await requireRole("TRAINER");
  const { t, locale } = await getT();
  const trainer = user.trainerProfile!;

  const clientCount = await prisma.clientProfile.count({ where: { trainerId: trainer.id } });

  const rows = [
    { icon: Mail, label: t("pf.email"), value: user.email },
    { icon: Ticket, label: t("pf.referralCode"), value: trainer.referralCode },
    { icon: Users, label: t("pf.clientsCount"), value: String(clientCount) },
    {
      icon: CalendarDays,
      label: t("pf.memberSince"),
      value: user.createdAt.toLocaleDateString(DATE_LOCALE[locale], {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("nav.profile")}</h1>
        <p className="text-slate-500 mt-1">{t("profile.subTrainer")}</p>
      </div>

      {/* Riepilogo profilo */}
      <div className="rounded-3xl glass p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl ?? undefined}
            alt={user.name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100 bg-slate-100"
          />
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900 truncate">{user.name}</p>
            <p className="text-sm text-slate-500">{t("role.trainer")}</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-slate-50">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <r.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">{r.label}</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{r.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modifica nome/foto */}
      <AccountSettings />
    </div>
  );
}
