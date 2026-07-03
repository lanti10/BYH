"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Share2, MessageCircle, Users, Dumbbell } from "lucide-react";

type Tab = "client" | "trainer";

export function InviteHub({ code, defaultTab = "client" }: { code: string; defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const path = tab === "client" ? "join" : "join-trainer";
  const link = `${origin}/${path}/${code}`;
  const message =
    tab === "client"
      ? `Ciao! Ti invito su BYH come mio cliente. Crea il tuo account con questo link e saremo subito collegati: ${link}`
      : `Ciao! Ti invito a entrare nella rete BYH come Personal Trainer. Registrati con questo link: ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      copy();
    }
  }

  return (
    <div className="rounded-3xl glass p-5 sm:p-6 shadow-sm">
      {/* Tabs */}
      <div className="flex gap-2 rounded-full bg-slate-100 p-1 mb-6">
        <button
          onClick={() => setTab("client")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors ${
            tab === "client" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          <Users className="h-4 w-4" /> Cliente
        </button>
        <button
          onClick={() => setTab("trainer")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors ${
            tab === "trainer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          <Dumbbell className="h-4 w-4" /> Trainer
        </button>
      </div>

      <p className="text-sm text-slate-500 text-center mb-5">
        {tab === "client"
          ? "Chi scansiona questo QR e crea l'account diventa tuo cliente."
          : "Chi scansiona questo QR e si registra come trainer entra nella tua rete."}
      </p>

      {/* QR code */}
      <div className="flex justify-center mb-5">
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          {origin ? (
            <QRCodeSVG
              value={link}
              size={200}
              marginSize={1}
              fgColor={tab === "client" ? "#059669" : "#FF3B30"}
              bgColor="#ffffff"
              level="M"
            />
          ) : (
            <div className="h-[200px] w-[200px] animate-pulse rounded-2xl bg-slate-100" />
          )}
        </div>
      </div>

      {/* Codice testuale */}
      <p className="text-center text-sm text-slate-400 mb-4">
        Codice: <span className="font-bold tracking-widest text-slate-700">{code}</span>
      </p>

      {/* Link */}
      <div className="flex items-center gap-2 mb-4">
        <code className="flex-1 truncate rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          {link || "..."}
        </code>
        <button
          onClick={copy}
          className="shrink-0 rounded-xl bg-slate-900 px-3 py-2.5 text-white transition-colors hover:bg-slate-700"
          aria-label="Copia link"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* Share */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <MessageCircle className="h-5 w-5" /> WhatsApp
        </a>
        <button
          onClick={nativeShare}
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <Share2 className="h-5 w-5" /> Condividi
        </button>
      </div>
    </div>
  );
}
