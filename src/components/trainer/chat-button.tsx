"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// Tasto "Chat" del dettaglio cliente con badge non letti in tempo reale (polling 5s).
export function ChatButton({ withUserId, initialUnread }: { withUserId: string; initialUnread: number }) {
  const { t } = useT();
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/messages/unread?with=${withUserId}`, { cache: "no-store" });
        if (res.ok && alive) setUnread((await res.json()).count ?? 0);
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
  }, [withUserId]);

  return (
    <Button
      variant="outline"
      size="sm"
      className="relative"
      render={<Link href={`/trainer/messages?c=${withUserId}`} />}
    >
      <MessageSquare className="h-4 w-4 mr-1" />
      {t("cd.chat")}
      {unread > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white tnum">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Button>
  );
}
