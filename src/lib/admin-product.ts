import "server-only";
import { prisma } from "@/lib/prisma";
import type { ProductFormData } from "@/components/admin/product-form";

/** Load a product into the shape the admin ProductForm edits. */
export async function loadProductFormData(
  id: string,
): Promise<ProductFormData | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) return null;

  return {
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
}

export const BOUTIQUE_CATEGORY_SLUG = "boutique";

/**
 * Products must belong to a category. Boutique items created from the Boutique
 * screen go into this hidden (inactive) category, so it never shows up in the
 * classic shop's menus.
 */
export async function ensureBoutiqueCategory() {
  return prisma.category.upsert({
    where: { slug: BOUTIQUE_CATEGORY_SLUG },
    update: {},
    create: {
      slug: BOUTIQUE_CATEGORY_SLUG,
      nameBg: "Бутик",
      nameEn: "Boutique",
      active: false,
      sortOrder: 999,
    },
  });
}
