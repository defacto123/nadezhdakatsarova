import type { Locale } from "@/i18n/routing";

/** Pick the right localized field value. */
export function pick(
  locale: string,
  bg: string | null | undefined,
  en: string | null | undefined,
): string {
  if (locale === "en") return en || bg || "";
  return bg || en || "";
}

export function localeOf(value: string): Locale {
  return value === "en" ? "en" : "bg";
}
