import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { loadProductFormData } from "@/lib/admin-product";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [initial, categories] = await Promise.all([
    loadProductFormData(id),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, nameEn: true },
    }),
  ]);

  if (!initial) notFound();

  return (
    <div>
      <h1 className="heading-display mb-6 text-3xl">Edit product</h1>
      <ProductForm categories={categories} initial={initial} />
    </div>
  );
}
