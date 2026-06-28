import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductGrid } from "@/components/storefront/product-grid";
import { searchProducts, toCards } from "@/lib/catalog";
import { SearchBox } from "@/components/storefront/search-box";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  const results = q ? await searchProducts(q) : [];

  return (
    <div className="container-page py-10">
      <h1 className="heading-display mb-6 text-3xl">{t("search")}</h1>
      <div className="mb-8 max-w-xl">
        <SearchBox defaultValue={q ?? ""} />
      </div>
      {q && (
        <p className="mb-6 text-sm text-muted-foreground">
          {results.length} — “{q}”
        </p>
      )}
      <ProductGrid products={toCards(results)} locale={locale} />
    </div>
  );
}
