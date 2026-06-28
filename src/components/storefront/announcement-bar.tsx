"use client";

import { useTranslations } from "next-intl";

export function AnnouncementBar() {
  const t = useTranslations();
  const message = t("newsletter.title");
  const items = Array.from({ length: 6 }, (_, i) => (
    <span key={i} className="mx-6 inline-flex items-center gap-2">
      {message}
      <span aria-hidden>•</span>
      {t("product.vatIncluded")}
      <span aria-hidden>•</span>
    </span>
  ));
  return (
    <div className="overflow-hidden bg-ink text-cream py-2 text-xs uppercase tracking-widest">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        <div className="flex">{items}</div>
        <div className="flex" aria-hidden>
          {items}
        </div>
      </div>
    </div>
  );
}
