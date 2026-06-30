"use client";

import { useState } from "react";
import NextImage from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Menu, Search, ShoppingBag, User, X, ChevronDown, Heart } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useIsHydrated } from "@/lib/hooks";
import { pick } from "@/lib/content";
import {
  heroMotionClassName,
  heroMotionInlineStyle,
} from "@/lib/site-design";
import { LocaleSwitcher } from "./locale-switcher";
import { cn } from "@/lib/utils";

type Cat = { slug: string; nameBg: string; nameEn: string };
type Brand = { line1: string; line2: string };
type Logo = {
  url: string;
  alt: string;
  animated: boolean;
  motion: string;
  speed: number;
  bgColor: string | null;
} | null;
type ImageMotion = { animated: boolean; motion: string; speed: number };

function Logotype({ logo, brand }: { logo: Logo; brand: Brand }) {
  if (logo) {
    return (
      <span
        className={cn(
          "relative block h-14 w-48 rounded-xl md:h-16 md:w-56",
          heroMotionClassName(logo.animated, logo.motion),
        )}
        style={{
          backgroundColor: logo.bgColor ?? "transparent",
          ...heroMotionInlineStyle(logo.animated, logo.motion, logo.speed),
        }}
      >
        <NextImage
          src={logo.url}
          alt={logo.alt || brand.line1}
          fill
          className="object-contain object-left"
          unoptimized={logo.url.startsWith("data:")}
          priority
        />
      </span>
    );
  }
  return (
    <span className="heading-display text-2xl italic leading-none">
      {brand.line1}
    </span>
  );
}

type BrushStyle = { hue: number; saturate: number; opacity: number };

// Warm-tan base the brush stroke is painted in. The brush image is used only as
// a mask (its alpha defines the stroke shape), so transparent areas can never
// show as white. Hue/saturation tune this base via the CMS.
export const BRUSH_BASE_COLOR = "#c79a5e";

export function brushStyle(
  brushUrl: string,
  brush: BrushStyle,
): React.CSSProperties {
  return {
    // The brush PNG is transparent with a painted stroke; using it as a mask
    // fills ONLY the stroke shape with BRUSH_BASE_COLOR and leaves everything
    // else transparent. This avoids the previous filter approach which turned
    // the light stroke nearly white. Hue/saturation adjust the solid fill.
    WebkitMaskImage: `url(${brushUrl})`,
    maskImage: `url(${brushUrl})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "100% 170px",
    maskSize: "100% 170px",
    WebkitMaskPosition: "center bottom",
    maskPosition: "center bottom",
    backgroundColor: BRUSH_BASE_COLOR,
    opacity: brush.opacity / 100,
    filter: `saturate(${brush.saturate}%) hue-rotate(${brush.hue}deg)`,
  };
}

function HeaderBrush({
  brushUrl,
  brush,
  motion,
}: {
  brushUrl: string | null;
  brush: BrushStyle;
  motion: ImageMotion;
}) {
  if (!brushUrl) return null;
  // Full-width wavy stroke. The band is taller than the header and is NOT
  // clipped, so the complete ribbon — both wavy edges — is visible and its
  // lower wavy edge spills below the header onto the hero, exactly like the
  // reference site. Opacity / saturation / hue are CMS-controlled so the menu
  // text stays readable and the colour can be tuned.
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-0 h-[85px]",
        heroMotionClassName(motion.animated, motion.motion),
      )}
      style={{
        ...brushStyle(brushUrl, brush),
        ...heroMotionInlineStyle(motion.animated, motion.motion, motion.speed),
      }}
    />
  );
}

export function Header({
  locale,
  categories,
  brand,
  logo,
  brushUrl = null,
  brush = { hue: 0, saturate: 100, opacity: 75 },
  brushMotion = { animated: false, motion: "float", speed: 4 },
}: {
  locale: string;
  categories: Cat[];
  brand: Brand;
  logo: Logo;
  brushUrl?: string | null;
  brush?: BrushStyle;
  brushMotion?: ImageMotion;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const mounted = useIsHydrated();
  const count = useCart((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  return (
    <header className="sticky top-0 z-40 bg-background">
      <HeaderBrush brushUrl={brushUrl} brush={brush} motion={brushMotion} />
      <div className="container-page relative z-10 flex h-20 items-center justify-between gap-6">
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" aria-label={brand.line1}>
            <Logotype logo={logo} brand={brand} />
          </Link>
        </div>

        {/* Center: primary navigation */}
        <nav className="hidden items-center gap-7 text-sm lg:flex">
          <Link href="/" className="hover:text-primary">
            {t("home")}
          </Link>
          <div className="group relative">
            <button className="inline-flex items-center gap-1 hover:text-primary">
              {t("shop")}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute left-1/2 z-50 mt-3 w-56 -translate-x-1/2 rounded-2xl border border-border bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
              <Link
                href="/shop"
                className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {t("allProducts")}
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-muted"
                >
                  {pick(locale, c.nameBg, c.nameEn)}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/shop" className="font-medium text-[var(--color-sale)]">
            {t("sale")}
          </Link>
          <a href="#newsletter" className="hover:text-primary">
            {t("newsletter")}
          </a>
          <Link href="/about" className="hover:text-primary">
            {t("about")}
          </Link>
          <Link href="/contact" className="hover:text-primary">
            {t("contact")}
          </Link>
        </nav>

        {/* Right: icons */}
        <div className="flex items-center gap-4">
          <LocaleSwitcher className="hidden sm:flex" />
          <Link href="/account" aria-label="Wishlist" className="hidden sm:block">
            <Heart className="h-5 w-5 hover:text-primary" />
          </Link>
          <Link href="/search" aria-label={t("search")}>
            <Search className="h-5 w-5 hover:text-primary" />
          </Link>
          <Link href="/account" aria-label={t("account")}>
            <User className="h-5 w-5 hover:text-primary" />
          </Link>
          <Link href="/cart" aria-label={t("cart")} className="relative">
            <ShoppingBag className="h-5 w-5 hover:text-primary" />
            {mounted && count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
        onClick={() => setOpen(false)}
      >
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-72 bg-cream p-6 shadow-xl transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="heading-display text-lg font-semibold italic">
              {brand.line1}
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            <Link href="/" onClick={() => setOpen(false)} className="py-2">
              {t("home")}
            </Link>
            <Link href="/shop" onClick={() => setOpen(false)} className="py-2">
              {t("shop")}
            </Link>
            <div className="py-2 text-xs uppercase tracking-wide text-muted-foreground">
              {t("catalogs")}
            </div>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                onClick={() => setOpen(false)}
                className="py-2 pl-3"
              >
                {pick(locale, c.nameBg, c.nameEn)}
              </Link>
            ))}
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="py-2 font-medium text-[var(--color-sale)]"
            >
              {t("sale")}
            </Link>
            <Link href="/about" onClick={() => setOpen(false)} className="py-2">
              {t("about")}
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="py-2"
            >
              {t("contact")}
            </Link>
            <div className="mt-4">
              <LocaleSwitcher />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
