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
