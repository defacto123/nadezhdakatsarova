"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { isRawImage, cn } from "@/lib/utils";

export type HeroSlideView = {
  eyebrow: string | null;
  headline: string | null;
  subtext: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export function HeroCarousel({ slides }: { slides: HeroSlideView[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count]);

  if (count === 0) return null;

  return (
    <section className="container-page mt-14 md:mt-16">
      <div className="relative h-[44vh] min-h-[320px] max-h-[460px] w-full overflow-hidden rounded-2xl bg-sand">
      {slides.map((slide, i) => {
        const hasText = Boolean(slide.headline || slide.eyebrow || slide.subtext);
        return (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === index ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={i === index ? undefined : true}
          >
            {slide.imageUrl && (
              <NextImage
                src={slide.imageUrl}
                alt={slide.headline ?? ""}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
                unoptimized={isRawImage(slide.imageUrl)}
              />
            )}
            {hasText && (
              <div className="absolute inset-0 bg-gradient-to-r from-ink/45 via-ink/15 to-transparent" />
            )}
            <div className="relative flex h-full flex-col justify-center px-6 sm:px-10 md:px-14">
              {hasText && (
                <div className="max-w-xl text-white">
                  {slide.eyebrow && (
                    <span className="text-xs font-semibold uppercase tracking-[0.25em]">
                      {slide.eyebrow}
                    </span>
                  )}
                  {slide.headline && (
                    <h1 className="mt-2 heading-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
                      {slide.headline}
                    </h1>
                  )}
                  {slide.subtext && (
                    <p className="mt-3 max-w-md text-sm sm:text-base">
                      {slide.subtext}
                    </p>
                  )}
                  {slide.ctaLabel && slide.ctaHref && (
                    <div className="mt-6">
                      <Link
                        href={slide.ctaHref}
                        className={buttonVariants({ size: "md" })}
                      >
                        {slide.ctaLabel}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-8 bg-white" : "w-2 bg-white/50",
              )}
            />
          ))}
        </div>
      )}
      </div>
    </section>
  );
}
