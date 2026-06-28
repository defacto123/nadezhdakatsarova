import { defineRouting } from "next-intl/routing";

export const locales = ["bg", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "bg";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
