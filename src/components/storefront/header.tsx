"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useIsHydrated } from "@/lib/hooks";
import { pick } from "@/lib/content";
import { LocaleSwitcher } from "./locale-switcher";
import { cn } from "@/lib/utils";

type Cat = { slug: string; nameBg: string; nameEn: string };

export function Header({
  locale,
  categories,
}: {
  locale: string;
  categories: Cat[];
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const mounted = useIsHydrated();
  const count = useCart((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-cream/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <button
          className="md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link href="/" className="flex flex-col leading-none">
          <span className="heading-display text-xl font-semibold tracking-tight">
            Nadezhda
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Katsarova · Art
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link href="/shop" className="hover:text-primary">
            {t("shop")}
          </Link>
          <div className="group relative">
            <button className="hover:text-primary">{t("catalogs")}</button>
            <div className="invisible absolute left-1/2 z-50 mt-3 w-56 -translate-x-1/2 rounded-2xl border border-border bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-muted"
                >
                  {pick(locale, c.nameBg, c.nameEn)}
                </Link>
              ))}
              {categories.length === 0 && (
                <span className="block px-3 py-2 text-sm text-muted-foreground">
                  —
                </span>
              )}
            </div>
          </div>
          <Link href="/about" className="hover:text-primary">
            {t("about")}
          </Link>
          <Link href="/contact" className="hover:text-primary">
            {t("contact")}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <LocaleSwitcher className="hidden sm:flex" />
          <Link href="/search" aria-label={t("search")}>
            <Search className="h-5 w-5 hover:text-primary" />
          </Link>
          <Link href="/account" aria-label={t("account")}>
            <User className="h-5 w-5 hover:text-primary" />
          </Link>
          <Link
            href="/cart"
            aria-label={t("cart")}
            className="relative"
          >
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
          "fixed inset-0 z-50 bg-black/40 transition-opacity md:hidden",
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
            <span className="heading-display text-lg font-semibold">Меню</span>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
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
