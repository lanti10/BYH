"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, translate, type Locale } from "./dict";

const VALID: Locale[] = ["it", "en", "pt", "es"];

export function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const m = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=(\\w+)`));
  const v = m?.[1] as Locale | undefined;
  return v && VALID.includes(v) ? v : DEFAULT_LOCALE;
}

export function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => setLocale(readLocaleCookie()), []);
  return locale;
}

// t() per componenti client
export function useT() {
  const locale = useLocale();
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );
  return { t, locale };
}
