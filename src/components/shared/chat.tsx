"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send } from "lucide-react";

type Msg = { id: string; senderId: string; content: string; createdAt: string };

export function Chat({ meId, otherId }: { meId: string; otherId: string }) {
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
            Nessun messaggio. Scrivi il primo!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;
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
                  {new Date(m.createdAt).toLocaleTimeString("it-IT", {
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
            placeholder="Scrivi un messaggio..."
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
            className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
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
