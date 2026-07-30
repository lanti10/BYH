import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SuspendButton } from "../suspend-button";
import { MoveClientForm } from "../move-client-form";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole("ADMIN");
  const { id } = await params;
  const { t, locale } = await getT();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      trainerProfile: {
        include: {
          referredBy: { include: { user: { select: { id: true, name: true } } } },
          clients: { include: { user: { select: { id: true, name: true } } } },
        },
      },
      clientProfile: {
        include: { trainer: { include: { user: { select: { id: true, name: true } } } } },
      },
    },
  });
  if (!user) notFound();

  const [plansCreated, sessionsCompleted] = await Promise.all([
    user.trainerProfile
      ? prisma.workoutPlan.count({ where: { trainerId: user.trainerProfile.id } })
      : Promise.resolve(0),
    user.clientProfile
      ? prisma.workoutSession.count({ where: { clientId: user.clientProfile.id } })
      : Promise.resolve(0),
  ]);

  const otherTrainers = user.clientProfile
    ? (
        await prisma.trainerProfile.findMany({
          where: { id: { not: user.clientProfile.trainerId } },
          include: { user: { select: { name: true } } },
          take: 200,
          orderBy: { user: { name: "asc" } },
        })
      ).map((tp) => ({ id: tp.id, name: tp.user.name }))
    : [];

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-4">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t("adm.people.back")}
      </Link>

      <div className="rounded-3xl glass p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
          {user.isAdmin && <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />}
          {user.suspended && (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
              {t("adm.people.suspended")}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-400">{user.email}</p>
        <p className="mt-1 text-xs text-slate-400">
          {t(`role.${user.role.toLowerCase()}`)} ·{" "}
          {t("adm.people.joined", { date: user.createdAt.toLocaleDateString(locale) })}
        </p>

        <div className="mt-5">
          {admin.id === user.id ? (
            <p className="text-xs text-slate-400">{t("adm.people.cannotSuspendSelf")}</p>
          ) : (
            <SuspendButton userId={user.id} suspended={user.suspended} />
          )}
        </div>
      </div>

      {user.trainerProfile && (
        <div className="space-y-4 rounded-3xl glass p-6">
          {user.trainerProfile.referredBy && (
            <p className="text-sm text-slate-600">
              {t("adm.people.referredBy")}:{" "}
              <Link
                href={`/admin/users/${user.trainerProfile.referredBy.user.id}`}
                className="font-medium text-slate-900 hover:underline"
              >
                {user.trainerProfile.referredBy.user.name}
              </Link>
            </p>
          )}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400">
              {t("adm.people.clientsOf")} ({user.trainerProfile.clients.length})
            </p>
            {user.trainerProfile.clients.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">{t("adm.people.noClients")}</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {user.trainerProfile.clients.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/users/${c.user.id}`} className="text-sm text-slate-700 hover:underline">
                      {c.user.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-slate-400">{t("wk.created", { n: plansCreated })}</p>
        </div>
      )}

      {user.clientProfile && (
        <div className="space-y-4 rounded-3xl glass p-6">
          <p className="text-sm text-slate-600">
            {t("adm.people.trainer")}:{" "}
            <Link
              href={`/admin/users/${user.clientProfile.trainer.user.id}`}
              className="font-medium text-slate-900 hover:underline"
            >
              {user.clientProfile.trainer.user.name}
            </Link>
          </p>
          <p className="text-xs text-slate-400">{t("adm.people.sessionsCompleted", { n: sessionsCompleted })}</p>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-slate-400">
              {t("adm.people.moveClient")}
            </p>
            <MoveClientForm clientProfileId={user.clientProfile.id} trainers={otherTrainers} />
          </div>
        </div>
      )}
    </div>
  );
}
