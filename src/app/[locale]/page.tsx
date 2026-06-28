import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/storefront/hero";
import { CategoryTiles } from "@/components/storefront/category-tiles";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import {
  getNewestProducts,
  getTrendingProducts,
  getFeaturedProducts,
  getDiscountedProducts,
  getTopLevelCategories,
  toCards,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [newest, trending, featured, discounted, categories] =
    await Promise.all([
      getNewestProducts(8),
      getTrendingProducts(4),
      getFeaturedProducts(8),
      getDiscountedProducts(4),
      getTopLevelCategories(),
    ]);

  return (
    <div className="pb-10">
      <Hero />

      {/* Artist intro */}
      <section className="container-page mt-14">
        <div className="rounded-3xl border border-border bg-white p-8 text-center sm:p-12">
          <h2 className="heading-display text-2xl sm:text-3xl">
            {t("artistTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            {t("artistText")}
          </p>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading title={t("shopByCategory")} />
        <CategoryTiles
          locale={locale}
          categories={categories.map((c) => ({
            slug: c.slug,
            nameBg: c.nameBg,
            nameEn: c.nameEn,
            image: c.image,
          }))}
        />
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          title={t("newest")}
          subtitle={t("newestSubtitle")}
          href="/shop"
          linkLabel={t("viewAll")}
        />
        <ProductGrid products={toCards(newest)} locale={locale} />
      </section>

      {featured.length > 0 && (
        <section className="container-page mt-16">
          <SectionHeading title={t("featured")} />
          <ProductGrid products={toCards(featured)} locale={locale} />
        </section>
      )}

      {trending.length > 0 && (
        <section className="container-page mt-16">
          <SectionHeading
            title={t("trending")}
            subtitle={t("trendingSubtitle")}
          />
          <ProductGrid products={toCards(trending)} locale={locale} />
        </section>
      )}

      {discounted.length > 0 && (
        <section className="container-page mt-16">
          <SectionHeading title={t("discounted")} />
          <ProductGrid products={toCards(discounted)} locale={locale} />
        </section>
      )}
    </div>
  );
}
