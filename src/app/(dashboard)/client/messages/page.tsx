import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { Chat } from "@/components/shared/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

export default async function ClientMessagesPage() {
  const user = await requireRole("CLIENT");
  const { t } = await getT();
  const client = user.clientProfile;

  const trainer = client
    ? await prisma.trainerProfile.findUnique({
        where: { id: client.trainerId },
        include: { user: true },
      })
    : null;

  if (!trainer) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">{t("nav.messages")}</h1>
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white/50 py-16 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-3" />
          <p className="text-slate-500">{t("msgs.notLinked")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <header className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
        <Avatar>
          <AvatarImage src={trainer.user.avatarUrl ?? undefined} />
          <AvatarFallback>{trainer.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">
            {trainer.user.name || trainer.user.email}
          </p>
          <p className="text-xs text-slate-400">{t("msgs.yourPT")}</p>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <Chat meId={user.id} otherId={trainer.userId} />
      </div>
    </div>
  );
}
