"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { Link } from "@/i18n/navigation";
import {
  HERO_PAIR_IMAGE,
  heroMotionClassName,
  heroMotionInlineStyle,
} from "@/lib/site-design";
import { isRawImage, cn } from "@/lib/utils";

export type HeroSlideView = {
  kind: "single" | "pair";
  imageUrl: string | null;
  imageUrl2: string | null;
  href: string | null;
  motion1: string;
  speed1: number;
  animated1: boolean;
  motion2: string;
  speed2: number;
  animated2: boolean;
  bgColor: string | null;
};

// Motion starts after the entrance (slide-in/fade) finishes.
const ENTRANCE_DELAY = 0.9;

export function HeroCarousel({ slides }: { slides: HeroSlideView[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count]);

  if (count === 0) return null;
  const safeIndex = index % count;
  const active = slides[safeIndex];

  return (
    <section className="container-page mt-14 md:mt-16">
      <div
        className="relative h-[44vh] min-h-[320px] max-h-[460px] w-full overflow-hidden rounded-2xl transition-colors duration-500"
        style={{ backgroundColor: active.bgColor ?? "transparent" }}
      >
        {/* Remount on index change so the entrance animation replays each cycle. */}
        <Slide key={safeIndex} slide={active} />
      </div>
    </section>
  );
}

function Slide({ slide }: { slide: HeroSlideView }) {
  return slide.kind === "pair" ? (
    <PairSlide slide={slide} />
  ) : (
    <SingleSlide slide={slide} />
  );
}

/** One big image with a soft fade-in plus its chosen continuous motion. */
function SingleSlide({ slide }: { slide: HeroSlideView }) {
  if (!slide.imageUrl) return null;
  const inner = (
    <div
      className={cn(
        "absolute inset-0",
        heroMotionClassName(slide.animated1, slide.motion1),
      )}
      style={heroMotionInlineStyle(
        slide.animated1,
        slide.motion1,
        slide.speed1,
        ENTRANCE_DELAY,
      )}
    >
      <NextImage
        src={slide.imageUrl}
        alt=""
        fill
        sizes="(max-width: 1280px) 100vw, 1280px"
        className="object-contain"
        priority
        unoptimized={isRawImage(slide.imageUrl)}
      />
    </div>
  );
  const faded = <div className="absolute inset-0 hero-fade-in">{inner}</div>;
  return withLink(slide.href, faded, "absolute inset-0 block");
}

/** Two images that slide in from the edges and gather, side by side, centred. */
function PairSlide({ slide }: { slide: HeroSlideView }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-3 px-4 sm:gap-8 md:gap-12">
      <EdgeImage
        src={slide.imageUrl}
        side="left"
        href={slide.href}
        animated={slide.animated1}
        motion={slide.motion1}
        speed={slide.speed1}
      />
      <EdgeImage
        src={slide.imageUrl2}
        side="right"
        href={slide.href}
        animated={slide.animated2}
        motion={slide.motion2}
        speed={slide.speed2}
      />
    </div>
  );
}

function EdgeImage({
  src,
  side,
  href,
  animated,
  motion,
  speed,
}: {
  src: string | null;
  side: "left" | "right";
  href: string | null;
  animated: boolean;
  motion: string;
  speed: number;
}) {
  if (!src) return null;
  const image = (
    <NextImage
      src={src}
      alt=""
      width={HERO_PAIR_IMAGE.width}
      height={HERO_PAIR_IMAGE.height}
      className="h-auto max-h-[15rem] w-auto object-contain sm:max-h-[20rem] md:max-h-[26rem]"
      priority
      unoptimized={isRawImage(src)}
    />
  );
  // Continuous motion lives on the inner element; the entrance slide-in
  // (translateX) on the outer wrapper, so the two transforms never fight.
  const moved = (
    <span
      className={cn("inline-block", heroMotionClassName(animated, motion))}
      style={heroMotionInlineStyle(animated, motion, speed, ENTRANCE_DELAY)}
    >
      {image}
    </span>
  );
  const slid = (
    <span
      className={cn(
        "inline-block",
        side === "left" ? "hero-slide-in-left" : "hero-slide-in-right",
      )}
    >
      {moved}
    </span>
  );
  return withLink(href, slid, "inline-block");
}

/** Wrap content in a redirect link (internal locale-aware or external). */
function withLink(
  href: string | null,
  content: React.ReactNode,
  className: string,
) {
  if (!href) return content;
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
