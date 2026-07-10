"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { dateFnsLocale } from "@/lib/i18n/datefns";
import { GOAL_KEYS } from "@/lib/i18n/dict";
import { useT } from "@/lib/i18n/client";

export type ClientRow = {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  activePlanName: string | null;
  lastSessionAt: number | null;
  lastWeight: number | null;
  goals: string[];
  createdAt: number;
};

type Activity = { userId: string; lastAt: number | null; unread: number };

// Lista clienti "stile WhatsApp" aggiornata in tempo reale (polling 5s):
// ri-ordina per ultimo messaggio e aggiorna i pallini dei non letti senza ricaricare.
export function ClientsList({
  clients,
  initialActivity,
}: {
  clients: ClientRow[];
  initialActivity: Activity[];
}) {
  const { t, locale } = useT();
  const [activity, setActivity] = useState<Record<string, Activity>>(() =>
    Object.fromEntries(initialActivity.map((a) => [a.userId, a]))
  );

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/trainer/clients-activity", { cache: "no-store" });
        if (!res.ok || !alive) return;
        const data = (await res.json()) as { activity: Activity[] };
        setActivity(Object.fromEntries(data.activity.map((a) => [a.userId, a])));
      } catch {
        /* offline */
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const sorted = [...clients].sort((a, b) => {
    const ta = activity[a.userId]?.lastAt ?? 0;
    const tb = activity[b.userId]?.lastAt ?? 0;
    if (tb !== ta) return tb - ta; // ultimo messaggio più recente in cima
    return b.createdAt - a.createdAt; // senza messaggi: più recenti prima
  });

  return (
    <div className="grid gap-3">
      {sorted.map((client) => {
        const unread = activity[client.userId]?.unread ?? 0;
        return (
          <Link key={client.id} href={`/trainer/clients/${client.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <Avatar>
                  <AvatarImage src={client.avatarUrl ?? undefined} />
                  <AvatarFallback>{client.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{client.name}</p>
                    {client.activePlanName && (
                      <Badge variant="secondary" className="text-xs">
                        {client.activePlanName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {client.lastSessionAt
                      ? t("cl.lastSession", {
                          time: formatDistanceToNow(new Date(client.lastSessionAt), {
                            locale: dateFnsLocale(locale),
                            addSuffix: true,
                          }),
                        })
                      : t("cl.noSession")}
                    {client.lastWeight ? ` · ${client.lastWeight} kg` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {client.goals.slice(0, 2).map((goal) => (
                    <Badge key={goal} variant="outline" className="text-xs hidden sm:flex">
                      {t(GOAL_KEYS[goal] ?? goal)}
                    </Badge>
                  ))}
                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white tnum">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
