import { it, enGB, pt, es } from "date-fns/locale";
import type { Locale as DFLocale } from "date-fns";
import type { Locale } from "./dict";

const MAP: Record<Locale, DFLocale> = { it, en: enGB, pt, es };

export function dateFnsLocale(locale: Locale): DFLocale {
  return MAP[locale] ?? it;
}
