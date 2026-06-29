import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ShopBrowser } from "@/components/storefront/shop-browser";
import { getAllProducts, toCards } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shop");
  const products = await getAllProducts();

  return (
    <div>
      {/* Page header band */}
      <div className="border-b border-border bg-sand">
        <div className="container-page py-10 text-center">
          <h1 className="heading-display text-3xl sm:text-4xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              {t("home")}
            </Link>{" "}
            <span aria-hidden>›</span> {t("title")}
          </p>
        </div>
      </div>

      <div className="container-page py-10">
        <ShopBrowser products={toCards(products)} locale={locale} />
      </div>
    </div>
  );
}
