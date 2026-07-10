// Service worker minimo: serve solo ad abilitare l'installazione PWA
// (Chrome/Android richiede un SW con un handler "fetch" per proporre l'install).
// È un passthrough puro: NON mette nulla in cache, così l'app non serve mai
// contenuti vecchi/offline — la rete resta la fonte di verità.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  /* Nessun respondWith → il browser usa la rete come di norma.
     L'handler deve solo esistere perché l'app sia "installabile". */
});

// ── Notifiche push (stile WhatsApp) ──
// Il server invia un payload JSON { title, body, icon, url, tag }; qui lo
// mostriamo come notifica di sistema, anche ad app chiusa.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "BYH";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png", // foto del mittente (o icona app)
    badge: "/icon-192.png",
    tag: data.tag, // stessa conversazione → la notifica si aggiorna invece di accumularsi
    renotify: Boolean(data.tag),
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Tap sulla notifica → apre/porta in primo piano la chat giusta.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
