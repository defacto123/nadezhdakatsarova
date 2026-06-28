import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, nameEn: true },
  });

  return (
    <div>
      <h1 className="heading-display mb-6 text-3xl">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
