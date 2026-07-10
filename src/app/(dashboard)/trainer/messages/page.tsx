import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { GOAL_KEYS } from "@/lib/i18n/dict";
import { Chat } from "@/components/shared/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/shared/back-button";

function ageFromBirth(birth?: Date | null): number | null {
  if (!birth) return null;
  return Math.floor((Date.now() - new Date(birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function TrainerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const user = await requireRole("TRAINER");
  const { t } = await getT();
  const trainer = user.trainerProfile!;
  const { c } = await searchParams;

  const clientProfiles = await prisma.clientProfile.findMany({
    where: { trainerId: trainer.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const unreadRows = await prisma.message.groupBy({
    by: ["senderId"],
    where: { receiverId: user.id, readAt: null },
    _count: true,
  });
  const unreadByUser = new Map(unreadRows.map((r) => [r.senderId, r._count]));

  const selected = c ? clientProfiles.find((cp) => cp.userId === c) ?? null : null;

  const chips: string[] = [];
  if (selected) {
    const age = ageFromBirth(selected.birthDate);
    if (age) chips.push(t("u.years", { n: age }));
    if (selected.height) chips.push(`${selected.height} cm`);
    if (selected.startWeight) chips.push(`${selected.startWeight} kg`);
    if (selected.trainingDaysPerWeek) chips.push(t("u.perWeek", { n: selected.trainingDaysPerWeek }));
    selected.goals.forEach((g) => chips.push(t(GOAL_KEYS[g] ?? g)));
  }

  return (
    <div data-chat-root className="flex h-[calc(100dvh-9.5rem)] lg:h-dvh">
      {/* Lista conversazioni */}
      <aside
        className={`${selected ? "hidden lg:flex" : "flex"} w-full lg:w-80 flex-col border-r border-slate-100 bg-white`}
      >
        <div className="px-5 py-4 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-900">{t("nav.messages")}</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {clientProfiles.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">
              {t("msgs.noClients")}
            </p>
          ) : (
            clientProfiles.map((cp) => {
              const unread = unreadByUser.get(cp.userId) ?? 0;
              const isActive = selected?.userId === cp.userId;
              return (
                <Link
                  key={cp.id}
                  href={`/trainer/messages?c=${cp.userId}`}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 transition-colors ${
                    isActive ? "bg-brand/5" : "hover:bg-slate-50"
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={cp.user.avatarUrl ?? undefined} />
                    <AvatarFallback>{cp.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {cp.user.name || cp.user.email}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{cp.goals[0] ? t(GOAL_KEYS[cp.goals[0]] ?? cp.goals[0]) : t("role.client")}</p>
                  </div>
                  {unread > 0 && (
                    <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat */}
      <section
        className={`${selected ? "flex" : "hidden lg:flex"} flex-1 flex-col bg-slate-50 min-w-0`}
      >
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
              <BackButton
                fallbackHref="/trainer/messages"
                label={t("common.back")}
                className="lg:hidden -ml-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              />
              <Avatar>
                <AvatarImage src={selected.user.avatarUrl ?? undefined} />
                <AvatarFallback>{selected.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link
                  href={`/trainer/clients/${selected.id}`}
                  className="font-semibold text-slate-900 hover:underline truncate block"
                >
                  {selected.user.name || selected.user.email}
                </Link>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {chips.slice(0, 4).map((chip, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </header>
            <div className="flex-1 min-h-0">
              <Chat meId={user.id} otherId={selected.userId} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
            <MessageSquare className="h-10 w-10 mb-3" />
            <p className="text-sm">{t("msgs.select")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
