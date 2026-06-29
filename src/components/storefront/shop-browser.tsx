"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "./product-card";
import { Select } from "@/components/ui/input";
import { formatPrice } from "@/lib/money";
import { effectiveUnitPriceCents } from "@/lib/pricing";
import { pick } from "@/lib/content";
import type { CardProduct } from "@/lib/types";

type Sort = "latest" | "priceAsc" | "priceDesc";

const eff = (p: CardProduct) =>
  effectiveUnitPriceCents({ priceCents: p.priceCents, salePercent: p.salePercent });

export function ShopBrowser({
  products,
  locale,
}: {
  products: CardProduct[];
  locale: string;
}) {
  const t = useTranslations("shop");

  const { categories, sizes, minEuro, maxEuro } = useMemo(() => {
    const catMap = new Map<string, { slug: string; name: string; count: number }>();
    const sizeMap = new Map<string, number>();
    let min = Infinity;
    let max = 0;
    for (const p of products) {
      const price = eff(p) / 100;
      min = Math.min(min, price);
      max = Math.max(max, price);
      const name = pick(locale, p.categoryNameBg, p.categoryNameEn);
      const existing = catMap.get(p.categorySlug);
      if (existing) existing.count += 1;
      else catMap.set(p.categorySlug, { slug: p.categorySlug, name, count: 1 });
      for (const s of p.sizes) sizeMap.set(s, (sizeMap.get(s) ?? 0) + 1);
    }
    return {
      categories: Array.from(catMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      sizes: Array.from(sizeMap.entries())
        .map(([size, count]) => ({ size, count }))
        .sort((a, b) => a.size.localeCompare(b.size)),
      minEuro: products.length ? Math.floor(min) : 0,
      maxEuro: products.length ? Math.ceil(max) : 0,
    };
  }, [products, locale]);

  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [priceMax, setPriceMax] = useState<number>(maxEuro);
  const [sort, setSort] = useState<Sort>("latest");

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (selectedCats.size > 0 && !selectedCats.has(p.categorySlug)) return false;
      if (
        selectedSizes.size > 0 &&
        !p.sizes.some((s) => selectedSizes.has(s))
      )
        return false;
      // Compare on the same whole-euro scale as the slider bounds so products
      // priced just above the floored minimum aren't hidden at the lowest step.
      if (Math.floor(eff(p) / 100) > priceMax) return false;
      return true;
    });
    if (sort === "priceAsc") list = [...list].sort((a, b) => eff(a) - eff(b));
    if (sort === "priceDesc") list = [...list].sort((a, b) => eff(b) - eff(a));
    return list;
  }, [products, selectedCats, selectedSizes, priceMax, sort]);

  const toggle = (set: Set<string>, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="space-y-8">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            {t("filterByPrice")}
          </h3>
          <div className="mt-4">
            <input
              type="range"
              min={minEuro}
              max={maxEuro}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {t("price")}: {formatPrice(minEuro * 100, locale)} —{" "}
              {formatPrice(priceMax * 100, locale)}
            </p>
          </div>
        </div>

        {sizes.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
              {t("filterBySize")}
            </h3>
            <ul className="mt-3 space-y-2">
              {sizes.map((s) => (
                <li key={s.size}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={selectedSizes.has(s.size)}
                      onChange={() =>
                        setSelectedSizes((prev) => toggle(prev, s.size))
                      }
                    />
                    {s.size} ({s.count})
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            {t("filterByCategories")}
          </h3>
          <ul className="mt-3 space-y-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={selectedCats.has(c.slug)}
                    onChange={() =>
                      setSelectedCats((prev) => toggle(prev, c.slug))
                    }
                  />
                  {c.name} ({c.count})
                </label>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Results */}
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <p className="text-sm text-muted-foreground">
            {t("showing", { count: filtered.length, total: products.length })}
          </p>
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-10 w-auto"
          >
            <option value="latest">{t("sortLatest")}</option>
            <option value="priceAsc">{t("sortPriceAsc")}</option>
            <option value="priceDesc">{t("sortPriceDesc")}</option>
          </Select>
        </div>
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("noResults")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
