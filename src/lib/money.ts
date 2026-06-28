export const CURRENCY = "EUR";

/** Format euro cents into a localized currency string, e.g. 1700 -> "17,00 €". */
export function formatPrice(cents: number, locale: string = "bg"): string {
  const intlLocale = locale === "bg" ? "bg-BG" : "en-IE";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: CURRENCY,
  }).format(cents / 100);
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function centsToEuros(cents: number): number {
  return Math.round(cents) / 100;
}
