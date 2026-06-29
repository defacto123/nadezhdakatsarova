import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CardProduct } from "@/lib/types";

export const productCardInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 2 },
  variants: true,
  category: true,
} satisfies Prisma.ProductInclude;

export type ProductCard = Prisma.ProductGetPayload<{
  include: typeof productCardInclude;
}>;

const baseWhere: Prisma.ProductWhereInput = { active: true };

export function totalStock(p: ProductCard): number {
  if (p.variants.length === 0) return 1; // simple product, treat as available
  return p.variants.reduce((s, v) => s + v.stock, 0);
}

/** Map a Prisma product into a serializable shape safe to pass to client components. */
export function toCard(p: ProductCard): CardProduct {
  const sizes = Array.from(
    new Set(
      p.variants
        .map((v) => v.size)
        .filter((s): s is string => Boolean(s)),
    ),
  );
  return {
    id: p.id,
    slug: p.slug,
    titleBg: p.titleBg,
    titleEn: p.titleEn,
    categorySlug: p.category.slug,
    categoryNameBg: p.category.nameBg,
    categoryNameEn: p.category.nameEn,
    priceCents: p.priceCents,
    salePercent: p.salePercent,
    isNew: p.isNew,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    sizes,
    totalStock: totalStock(p),
    hasVariants: p.variants.length > 0,
  };
}

export function toCards(list: ProductCard[]): CardProduct[] {
  return list.map(toCard);
}

export async function getCategories() {
  return prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { nameBg: "asc" }],
    include: { children: true },
  });
}

export async function getTopLevelCategories() {
  return prisma.category.findMany({
    where: { active: true, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { nameBg: "asc" }],
  });
}

export async function getNewestProducts(take = 8) {
  return prisma.product.findMany({
    where: baseWhere,
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getTrendingProducts(take = 4) {
  return prisma.product.findMany({
    where: baseWhere,
    include: productCardInclude,
    orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getFeaturedProducts(take = 8) {
  return prisma.product.findMany({
    where: { ...baseWhere, featured: true },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getDiscountedProducts(take = 8) {
  return prisma.product.findMany({
    where: { ...baseWhere, salePercent: { gt: 0 } },
    include: productCardInclude,
    orderBy: { salePercent: "desc" },
    take,
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });
}

export async function getProductsByCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: true },
  });
  if (!category) return null;

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];
  const products = await prisma.product.findMany({
    where: { ...baseWhere, categoryId: { in: categoryIds } },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
  });
  return { category, products };
}

export async function getAllProducts() {
  return prisma.product.findMany({
    where: baseWhere,
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function searchProducts(query: string) {
  const q = query.trim();
  if (!q) return [];
  return prisma.product.findMany({
    where: {
      ...baseWhere,
      OR: [
        { titleBg: { contains: q, mode: "insensitive" } },
        { titleEn: { contains: q, mode: "insensitive" } },
        { descriptionBg: { contains: q, mode: "insensitive" } },
        { descriptionEn: { contains: q, mode: "insensitive" } },
      ],
    },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  take = 4,
) {
  return prisma.product.findMany({
    where: { ...baseWhere, categoryId, id: { not: excludeId } },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}
