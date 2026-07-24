// Utilità condivise per l'area prodotti (catalogo Amazon affiliate BYH).
// Nessun "server only": usato sia lato server sia lato client.

// Categorie canoniche (salvate nel DB come slug) → chiavi i18n per l'etichetta.
export const PRODUCT_CATEGORIES = ["supplements", "recovery", "food", "apparel"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_KEYS: Record<string, string> = {
  supplements: "cat.supplements",
  recovery: "cat.recovery",
  food: "cat.food",
  apparel: "cat.apparel",
};

// Prodotto nella forma che passiamo ai componenti client (niente campi interni).
export type ShopProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  price: number; // salePrice, sincronizzato da Amazon
  amazonUrl: string;
};

// Costruisce il link d'acquisto Amazon aggiungendo il subtag di attribuzione
// (ascsubtag): è ciò che ci permette, dai report Amazon, di risalire a chi
// ha generato la vendita (cliente → suo PT → rete MLM).
// subtag esempio: "c<clientProfileId>" (cliente) o "t<trainerProfileId>" (PT per sé).
export function buildAmazonLink(url: string | null | undefined, subtag?: string | null): string {
  if (!url) return "#";
  try {
    const u = new URL(url);
    if (subtag) u.searchParams.set("ascsubtag", subtag);
    return u.toString();
  } catch {
    return url;
  }
}

// Prezzo formattato secondo la lingua (Amazon → EUR).
export function formatPrice(price: number, locale = "it-IT"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(price);
}
