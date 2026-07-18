"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Search, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { dateFnsLocale } from "@/lib/i18n/datefns";
import { GOAL_KEYS } from "@/lib/i18n/dict";
import { useT } from "@/lib/i18n/client";

export type ClientRow = {
  id: string;
  userId: string;
  // Da quale link è arrivata la persona: /join = cliente, /join-trainer = PT della rete
  kind: "client" | "trainer";
  name: string;
  avatarUrl: string | null;
  activePlanName: string | null;
  lastSessionAt: number | null;
  lastWeight: number | null;
  goals: string[];
  createdAt: number;
  clientsCount?: number; // solo per i PT della rete
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
  const [query, setQuery] = useState("");

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

  const q = query.trim().toLowerCase();
  const filtered = q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;

  const sorted = [...filtered].sort((a, b) => {
    const ta = activity[a.userId]?.lastAt ?? 0;
    const tb = activity[b.userId]?.lastAt ?? 0;
    if (tb !== ta) return tb - ta; // ultimo messaggio più recente in cima
    return b.createdAt - a.createdAt; // senza messaggi: più recenti prima
  });

  return (
    <>
      {/* Ricerca per nome: utile quando i clienti sono tanti */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("cl.searchPh")}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-base text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label={t("common.close")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {sorted.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">{t("cl.noMatch")}</p>
      )}

    <div className="grid grid-cols-1 gap-3">
      {sorted.map((client) => {
        const unread = activity[client.userId]?.unread ?? 0;
        const isTrainer = client.kind === "trainer";
        const card = (
            <Card className={isTrainer ? "" : "hover:shadow-md transition-shadow cursor-pointer"}>
              <CardContent className="flex items-center gap-4 py-4">
                <Avatar>
                  <AvatarImage src={client.avatarUrl ?? undefined} />
                  <AvatarFallback>{client.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="min-w-0 truncate font-semibold text-slate-900">{client.name}</p>
                    {/* Chi è: cliente tuo, o PT che hai portato in rete */}
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        isTrainer ? "bg-blue-500/10 text-blue-600" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isTrainer ? t("cl.kindTrainer") : t("cl.kindClient")}
                    </span>
                    {client.activePlanName && (
                      <Badge variant="secondary" className="min-w-0 max-w-[45%] shrink-[99] text-xs">
                        <span className="min-w-0 truncate">{client.activePlanName}</span>
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500 mt-0.5">
                    {isTrainer
                      ? t("cl.count", { n: client.clientsCount ?? 0 })
                      : (client.lastSessionAt
                          ? t("cl.lastSession", {
                              time: formatDistanceToNow(new Date(client.lastSessionAt), {
                                locale: dateFnsLocale(locale),
                                addSuffix: true,
                              }),
                            })
                          : t("cl.noSession")) +
                        (client.lastWeight ? ` · ${client.lastWeight} kg` : "")}
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
                  {!isTrainer && <ChevronRight className="h-4 w-4 text-slate-400" />}
                </div>
              </CardContent>
            </Card>
        );
        // Il profilo si apre solo per i clienti: un PT della rete non ha una scheda tua da vedere.
        return isTrainer ? (
          <div key={client.id} className="min-w-0">{card}</div>
        ) : (
          <Link key={client.id} href={`/trainer/clients/${client.id}`} className="block min-w-0">
            {card}
          </Link>
        );
      })}
    </div>
    </>
  );
}
