import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="heading-display mb-6 text-3xl">Categories</h1>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          nameBg: c.nameBg,
          nameEn: c.nameEn,
          descriptionBg: c.descriptionBg,
          descriptionEn: c.descriptionEn,
          image: c.image,
          parentId: c.parentId,
          sortOrder: c.sortOrder,
          active: c.active,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
