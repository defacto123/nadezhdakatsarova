"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

const SLIDES = [
  {
    eyebrow: "Handmade · Limited",
    bg: "from-[#e9c7b8] via-[#f1e8da] to-[#fbf7f0]",
  },
  {
    eyebrow: "New collection",
    bg: "from-[#cdd6bf] via-[#eef0e6] to-[#fbf7f0]",
  },
  {
    eyebrow: "Art you can wear",
    bg: "from-[#f3d9cd] via-[#f6ece2] to-[#fbf7f0]",
  },
];

export function Hero() {
  const t = useTranslations();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="container-page pt-6">
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${slide.bg} px-6 py-16 transition-all duration-700 sm:px-12 sm:py-24`}
      >
        <div className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-soft">
            {slide.eyebrow}
          </span>
          <h1 className="mt-4 heading-display text-4xl leading-tight sm:text-6xl">
            {t("site.name")}
          </h1>
          <p className="mt-4 max-w-md text-base text-ink-soft sm:text-lg">
            {t("site.tagline")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className={buttonVariants({ size: "lg" })}>
              {t("home.heroCtaShop")}
            </Link>
            <Link
              href="/shop"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              {t("home.heroCtaCatalogs")}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-ink" : "w-2 bg-ink/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
