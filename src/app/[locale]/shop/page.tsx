import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getAllProducts, toCards } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const products = await getAllProducts();

  return (
    <div className="container-page py-10">
      <h1 className="heading-display mb-8 text-3xl sm:text-4xl">{t("shop")}</h1>
      <ProductGrid products={toCards(products)} locale={locale} />
    </div>
  );
}
