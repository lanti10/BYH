"use client";

import { useCallback, useEffect, useState } from "react";

// VAPID public key → formato richiesto da PushManager.subscribe
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Gestione iscrizione Web Push: rilevamento supporto, permesso e subscribe.
export function usePush() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) return false;
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
        });
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // Se il permesso è già concesso, assicura l'iscrizione (device nuovo, ecc.)
  useEffect(() => {
    if (supported && permission === "granted") void subscribe();
  }, [supported, permission, subscribe]);

  // Richiede il permesso (deve partire da un gesto utente → obbligatorio su iOS)
  const enable = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "granted") await subscribe();
    } finally {
      setBusy(false);
    }
  }, [supported, subscribe]);

  return { supported, permission, busy, enable };
}
