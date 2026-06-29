"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export type HeroSlideView = {
  eyebrow: string | null;
  headline: string;
  subtext: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export function Hero({ slides }: { slides: HeroSlideView[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count]);

  if (count === 0) return null;
  const slide = slides[Math.min(index, count - 1)];
  const hasImage = Boolean(slide.imageUrl);

  return (
    <section className="container-page pt-6">
      <div
        className="relative grid overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-surface)] to-[var(--color-background)] md:grid-cols-2"
        style={{ minHeight: "26rem" }}
      >
        <div className="flex flex-col justify-center px-6 py-14 sm:px-12">
          {slide.eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-soft">
              {slide.eyebrow}
            </span>
          )}
          <h1 className="mt-4 heading-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            {slide.headline}
          </h1>
          {slide.subtext && (
            <p className="mt-4 max-w-md text-base text-ink-soft sm:text-lg">
              {slide.subtext}
            </p>
          )}
          {slide.ctaLabel && slide.ctaHref && (
            <div className="mt-8">
              <Link
                href={slide.ctaHref}
                className={buttonVariants({ size: "lg" })}
              >
                {slide.ctaLabel}
              </Link>
            </div>
          )}
        </div>

        {hasImage && (
          <div className="relative min-h-64 md:min-h-full">
            <NextImage
              src={slide.imageUrl as string}
              alt={slide.headline}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              unoptimized={(slide.imageUrl as string).startsWith("data:")}
              priority
            />
          </div>
        )}

        {count > 1 && (
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
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
        )}
      </div>
    </section>
  );
}
