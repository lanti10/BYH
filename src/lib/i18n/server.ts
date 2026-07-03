import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, translate, type Locale } from "./dict";

const VALID: Locale[] = ["it", "en", "pt", "es"];

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value as Locale | undefined;
  return c && VALID.includes(c) ? c : DEFAULT_LOCALE;
}

// Restituisce la funzione di traduzione per la lingua corrente (server components)
export async function getT() {
  const locale = await getLocale();
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
  return { t, locale };
}
