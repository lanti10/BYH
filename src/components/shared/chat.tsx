"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, ExternalLink, ImageIcon } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { DATE_LOCALE } from "@/lib/i18n/dict";
import { CATEGORY_KEYS, formatPrice } from "@/lib/products";

type ChatProduct = {
  name: string;
  imageUrl: string | null;
  category: string;
  price: number;
  note: string | null;
  buyUrl: string;
};

type Msg = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  type?: string;
  product?: ChatProduct | null;
};

export function Chat({ meId, otherId }: { meId: string; otherId: string }) {
  const { t, locale } = useT();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?with=${otherId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {
      /* offline */
    } finally {
      setLoaded(true);
    }
  }, [otherId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    setMessages((m) => [
      ...m,
      { id: "tmp" + Date.now(), senderId: meId, content, createdAt: new Date().toISOString() },
    ]);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: otherId, content }),
      });
      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loaded && messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">
            {t("chat.empty")}
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;

          // Messaggio-prodotto condiviso dal PT: card con nota e acquisto su Amazon
          if (m.type === "PRODUCT_RECOMMENDATION" && m.product) {
            const p = m.product;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[82%] rounded-2xl border border-slate-100 bg-white p-2">
                  <div className="flex gap-2.5">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-slate-300" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium leading-tight text-slate-900">{p.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {t(CATEGORY_KEYS[p.category] ?? p.category)}
                      </p>
                      <p className="text-[15px] font-semibold text-slate-900 tnum">
                        {formatPrice(p.price, DATE_LOCALE[locale])}
                      </p>
                    </div>
                  </div>

                  {p.note && (
                    <p className="my-2 rounded-xl bg-indigo-50 px-2.5 py-2 text-xs leading-relaxed text-indigo-700">
                      {p.note}
                    </p>
                  )}

                  <a
                    href={p.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
                  >
                    {t("shop.buyOnAmazon")}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    {new Date(m.createdAt).toLocaleTimeString(DATE_LOCALE[locale], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine
                    ? "bg-brand text-white rounded-br-md"
                    : "bg-white border border-slate-100 text-slate-800 rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-0.5 text-[10px] ${mine ? "text-white/60" : "text-slate-400"}`}>
                  {new Date(m.createdAt).toLocaleTimeString(DATE_LOCALE[locale], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/60 glass-prominent p-3">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t("chat.placeholder")}
            type="text"
            name="byh-chat-message"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="send"
            data-form-type="other"
            data-1p-ignore
            data-lpignore="true"
            data-chat-input
            className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-40"
            aria-label="Invia"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
