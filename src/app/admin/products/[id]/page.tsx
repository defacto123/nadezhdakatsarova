import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm, type ProductFormData } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, nameEn: true },
    }),
  ]);

  if (!product) notFound();

  const initial: ProductFormData = {
    id: product.id,
    slug: product.slug,
    titleBg: product.titleBg,
    titleEn: product.titleEn,
    descriptionBg: product.descriptionBg ?? "",
    descriptionEn: product.descriptionEn ?? "",
    priceEuros: (product.priceCents / 100).toFixed(2),
    salePercent: product.salePercent ? String(product.salePercent) : "",
    featured: product.featured,
    isNew: product.isNew,
    active: product.active,
    categoryId: product.categoryId,
    images: product.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
    variants: product.variants.map((v) => ({
      size: v.size ?? "",
      color: v.color ?? "",
      sku: v.sku ?? "",
      stock: v.stock,
      priceOverrideEuros:
        v.priceOverrideCents != null
          ? (v.priceOverrideCents / 100).toFixed(2)
          : "",
    })),
  };

  return (
    <div>
      <h1 className="heading-display mb-6 text-3xl">Edit product</h1>
      <ProductForm categories={categories} initial={initial} />
    </div>
  );
}
