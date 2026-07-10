"use client";

import { useEffect, useState } from "react";
import { Download, Share, Plus, Check, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// Card "Installa BYH" (PWA → schermata Home).
// - Android / desktop Chrome: cattura `beforeinstallprompt` → installazione nativa in un tocco.
// - iPhone (Safari): iOS non permette l'install programmatico → apre una mini-guida
//   (Condividi → Aggiungi alla schermata Home).
// - Se l'app è già installata (standalone) o l'utente ha chiuso la card → non compare.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "byh-install-dismissed";

export function InstallPrompt() {
  const { t } = useT();
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    // Già installata? (avviata dalla Home in standalone)
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (standalone) return;

    // Già chiusa dall'utente?
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* storage non disponibile */
    }

    // Registra il service worker (necessario per l'install nativo su Chrome/Android)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    // Solo Safari può "Aggiungi alla Home"; Chrome/Firefox iOS non possono installare.
    const iosSafari = ios && !/crios|fxios|edgios/i.test(ua);
    setIsIOS(ios);

    // Android / desktop Chrome: intercetta l'evento e mostra la card
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari: nessun evento → mostra comunque la card (aprirà la guida)
    if (iosSafari) setVisible(true);

    // A installazione avvenuta, nascondi e non riproporre
    const onInstalled = () => {
      setVisible(false);
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignora */
      }
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    setSheet(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignora */
    }
  }

  async function onInstall() {
    if (deferred) {
      await deferred.prompt(); // prompt nativo (Android/desktop)
      try {
        await deferred.userChoice;
      } catch {
        /* ignora */
      }
      setDeferred(null);
      setVisible(false);
    } else if (isIOS) {
      setSheet(true); // guida manuale iOS
    }
  }

  if (!visible) return null;

  const steps: { icon: typeof Share; text: string }[] = [
    { icon: Share, text: t("install.iosStep1") },
    { icon: Plus, text: t("install.iosStep2") },
    { icon: Check, text: t("install.iosStep3") },
  ];

  return (
    <>
      <div className="flex items-center gap-3 rounded-3xl glass p-3 pr-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 leading-tight">{t("install.title")}</p>
          <p className="mt-0.5 text-xs text-slate-500 leading-tight">{t("install.sub")}</p>
        </div>
        <button
          onClick={onInstall}
          className="shrink-0 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-cta hover:bg-brand-hover"
        >
          {t("install.cta")}
        </button>
        <button
          onClick={dismiss}
          aria-label={t("common.close")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Guida iOS (Condividi → Aggiungi alla Home) */}
      {sheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setSheet(false)}
        >
          <div
            className="w-full rounded-t-3xl glass-prominent p-6 pb-8 sm:max-w-md sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">{t("install.iosTitle")}</h3>
              <button
                onClick={() => setSheet(false)}
                aria-label={t("common.close")}
                className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="space-y-3">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={i} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white tnum">
                      {i + 1}
                    </span>
                    <p className="flex-1 text-sm text-slate-700">{s.text}</p>
                    <Icon className="h-5 w-5 shrink-0 text-brand" />
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
