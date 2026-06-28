import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ProductDetail,
  type DetailProduct,
} from "@/components/storefront/product-detail";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import { getProductBySlug, getRelatedProducts, toCards } from "@/lib/catalog";
import { pick } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = pick(locale, product.titleBg, product.titleEn);
  const description = pick(locale, product.descriptionBg, product.descriptionEn);
  return {
    title,
    description: description?.slice(0, 160),
    openGraph: {
      title,
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("product");

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id, 4);

  const detail: DetailProduct = {
    id: product.id,
    slug: product.slug,
    titleBg: product.titleBg,
    titleEn: product.titleEn,
    descriptionBg: product.descriptionBg,
    descriptionEn: product.descriptionEn,
    priceCents: product.priceCents,
    salePercent: product.salePercent,
    images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stock: v.stock,
      priceOverrideCents: v.priceOverrideCents,
    })),
  };

  const totalStock = product.variants.length
    ? product.variants.reduce((s, v) => s + v.stock, 0)
    : 1;
  const effectivePrice =
    product.salePercent && product.salePercent > 0
      ? Math.round(product.priceCents * (1 - product.salePercent / 100))
      : product.priceCents;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pick(locale, product.titleBg, product.titleEn),
    description: pick(locale, product.descriptionBg, product.descriptionEn),
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (effectivePrice / 100).toFixed(2),
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={detail} locale={locale} />

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading title={t("relatedProducts")} />
          <ProductGrid products={toCards(related)} locale={locale} />
        </section>
      )}
    </div>
  );
}
