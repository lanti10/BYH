// Scope v1 — fonte di verità unica per il gating "coming soon".
//
// v1 = SOLO coaching core (schede, allenamento, progressi, chat, referral).
// Commerce (shop / prodotti / guadagni) arriva in Fase 2.
//
// Per riattivare una sezione in futuro: togli il suo href da DISABLED_HREFS.
// Le voci nella nav (tab-bar + sidebar) che iniziano con uno di questi href
// vengono nascoste automaticamente, così nessun utente finisce su uno schermo morto.

// Interruttore commerce: in v1 è OFF (niente shop, prodotti, raccomandazioni,
// guadagni). Metti a `true` in Fase 2 per riaccendere sezioni e blocchi UI.
export const COMMERCE_ENABLED = false;

export const DISABLED_HREFS = [
  "/client/shop",
  "/trainer/products",
  "/trainer/earnings",
] as const;

/** true se la destinazione è fuori dallo scope v1 (da nascondere nella nav). */
export function isDisabled(href: string): boolean {
  return DISABLED_HREFS.some((d) => href === d || href.startsWith(d + "/"));
}
