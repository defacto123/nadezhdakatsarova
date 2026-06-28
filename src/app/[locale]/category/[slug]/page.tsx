import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getProductsByCategory, toCards } from "@/lib/catalog";
import { pick } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = await getProductsByCategory(slug);
  if (!data) notFound();

  const { category, products } = data;
  const description = pick(
    locale,
    category.descriptionBg,
    category.descriptionEn,
  );

  return (
    <div className="container-page py-10">
      <h1 className="heading-display text-3xl sm:text-4xl">
        {pick(locale, category.nameBg, category.nameEn)}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      )}
      <div className="mt-8">
        <ProductGrid products={toCards(products)} locale={locale} />
      </div>
    </div>
  );
}
