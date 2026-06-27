"use client";

import { useState } from "react";
import { Copy, Check, Share2, MessageCircle } from "lucide-react";

export function ShareReferral({ code }: { code: string }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [origin, setOrigin] = useState("");

  // origin sicuro solo lato client
  if (typeof window !== "undefined" && origin === "") {
    setOrigin(window.location.origin);
  }

  const link = `${origin}/join/${code}`;
  const message = `Ciao! Ti invito su BYH - Build Your Health. Crea il tuo account con questo link e saremo subito collegati: ${link}`;

  async function copy(text: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      /* clipboard non disponibile */
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "BYH - Build Your Health", text: message, url: link });
      } catch {
        /* annullato */
      }
    } else {
      copy(link, "link");
    }
  }

  return (
    <div className="space-y-5">
      {/* Codice grande */}
      <div className="rounded-3xl bg-gradient-to-br from-[#D42B27] to-[#a81f1c] p-6 text-center text-white shadow-lg">
        <p className="text-sm font-medium text-white/70">Il tuo codice invito</p>
        <p className="mt-2 text-4xl font-black tracking-[0.3em]">{code}</p>
        <button
          onClick={() => copy(code, "code")}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/25"
        >
          {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiedCode ? "Copiato!" : "Copia codice"}
        </button>
      </div>

      {/* Link */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <p className="text-xs font-medium text-slate-400 mb-2">Link d&apos;invito</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            {link || "..."}
          </code>
          <button
            onClick={() => copy(link, "link")}
            className="shrink-0 rounded-xl bg-slate-900 px-3 py-2.5 text-white transition-colors hover:bg-slate-700"
            aria-label="Copia link"
          >
            {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Pulsanti condivisione */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </a>
        <button
          onClick={nativeShare}
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <Share2 className="h-5 w-5" />
          Condividi
        </button>
      </div>
    </div>
  );
}
