import NextImage from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroCarousel, type HeroSlideView } from "@/components/storefront/hero-carousel";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeading } from "@/components/storefront/section-heading";
import {
  getNewestProducts,
  getFeaturedProducts,
  getDiscountedProducts,
  toCards,
} from "@/lib/catalog";
import {
  getContentMap,
  getSiteImages,
  getHeroSlides,
  getResolvedTheme,
} from "@/lib/site-settings";
import {
  contentValue,
  heroMotionClassName,
  heroMotionInlineStyle,
} from "@/lib/site-design";
import { cn, isRawImage } from "@/lib/utils";
import type { CardProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [newest, featured, discounted, content, images, heroRows, theme] =
    await Promise.all([
      getNewestProducts(6),
      getFeaturedProducts(6),
      getDiscountedProducts(6),
      getContentMap(),
      getSiteImages(),
      getHeroSlides(),
      getResolvedTheme(),
    ]);

  const c = (key: string) => contentValue(content, key, locale);
  const sideImage = (slot: string): SideImage | null => {
    const r = images[slot];
    if (!r) return null;
    return {
      url: r.url,
      alt: (locale === "en" ? r.altEn : r.altBg) ?? "",
      animated: r.animated,
      motion: r.motion,
      speed: r.speed,
      bgColor: r.bgColor,
    };
  };

  let heroSlides: HeroSlideView[] = heroRows.map((s) => ({
    kind: s.kind === "pair" ? "pair" : "single",
    imageUrl: s.imageUrl ?? null,
    imageUrl2: s.imageUrl2 ?? null,
    href: s.href ?? null,
    motion1: s.motion1,
    speed1: s.speed1,
    animated1: s.animated1,
    motion2: s.motion2,
    speed2: s.speed2,
    animated2: s.animated2,
    bgColor: s.bgColor ?? null,
  }));

  if (heroSlides.length === 0) {
    heroSlides = [
      {
        kind: "pair",
        imageUrl: "/hero/pair-left.png",
        imageUrl2: "/hero/pair-right.png",
        href: "/shop",
        motion1: "float",
        speed1: 4,
        animated1: true,
        motion2: "sway",
        speed2: 5,
        animated2: true,
        bgColor: "#f4efe9",
      },
      {
        kind: "single",
        imageUrl: "/hero/single.png",
        imageUrl2: null,
        href: "/shop",
        motion1: "pulse",
        speed1: 3,
        animated1: true,
        motion2: "float",
        speed2: 4,
        animated2: true,
        bgColor: "#f4efe9",
      },
    ];
  }

  return (
    <div className="pb-10">
      <HeroCarousel slides={heroSlides} cycleSeconds={theme.heroCycleSeconds} />

      <SideProductSection
        title={c("home.newestTitle")}
        subtitle={c("home.newestSubtitle")}
        side={sideImage("home-side-1")}
        sidePosition="left"
        products={toCards(newest)}
        locale={locale}
        viewAllHref="/shop"
        viewAllLabel={t("home.viewAll")}
      />

      {featured.length > 0 && (
        <SideProductSection
          title={c("home.featuredTitle")}
          side={sideImage("home-side-2")}
          sidePosition="right"
          products={toCards(featured)}
          locale={locale}
        />
      )}

      {discounted.length > 0 && (
        <SideProductSection
          title={c("home.discountedTitle")}
          side={sideImage("home-side-3")}
          sidePosition="left"
          products={toCards(discounted)}
          locale={locale}
        />
      )}
    </div>
  );
}

type SideImage = {
  url: string;
  alt: string;
  animated: boolean;
  motion: string;
  speed: number;
  bgColor: string | null;
};

function SideDecoration({
  side,
  maxWidth,
}: {
  side: SideImage;
  maxWidth: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-2xl",
        heroMotionClassName(side.animated, side.motion),
      )}
      style={{
        backgroundColor: side.bgColor ?? "transparent",
        ...heroMotionInlineStyle(side.animated, side.motion, side.speed),
      }}
    >
      <NextImage
        src={side.url}
        alt={side.alt}
        aria-hidden={side.alt ? undefined : true}
        width={300}
        height={400}
        className={cn("h-auto w-full object-contain", maxWidth)}
        unoptimized={isRawImage(side.url)}
      />
    </span>
  );
}

function SideProductSection({
  title,
  subtitle,
  side,
  sidePosition,
  products,
  locale,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  subtitle?: string;
  side: SideImage | null;
  sidePosition: "left" | "right";
  products: CardProduct[];
  locale: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  if (products.length === 0) return null;

  const sideEl = side ? (
    <div className="relative hidden min-h-[20rem] items-center justify-center lg:flex">
      <SideDecoration side={side} maxWidth="max-w-[300px]" />
    </div>
  ) : null;

  const grid = (
    <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} locale={locale} />
      ))}
    </div>
  );

  return (
    <section className="container-page mt-20">
      <SectionHeading
        title={title}
        subtitle={subtitle}
        href={viewAllHref}
        linkLabel={viewAllLabel}
      />
      {side && (
        <div className="mb-6 flex justify-center lg:hidden">
          <SideDecoration side={side} maxWidth="max-w-[220px]" />
        </div>
      )}
      <div
        className={cn(
          "grid items-center gap-8 lg:gap-12",
          side &&
            (sidePosition === "left"
              ? "lg:grid-cols-[280px_minmax(0,1fr)]"
              : "lg:grid-cols-[minmax(0,1fr)_280px]"),
        )}
      >
        {side && sidePosition === "left" && sideEl}
        {grid}
        {side && sidePosition === "right" && sideEl}
      </div>
    </section>
  );
}
