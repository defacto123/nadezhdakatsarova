import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { loadProductFormData } from "@/lib/admin-product";

export const dynamic = "force-dynamic";

export default async function EditBoutiqueItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initial = await loadProductFormData(id);
  if (!initial) notFound();

  return (
    <div>
      <Link href="/admin/boutique" className="text-sm text-muted-foreground hover:text-primary">
        ← Boutique
      </Link>
      <h1 className="heading-display mb-6 mt-2 text-3xl">Edit boutique item</h1>
      {/* The product keeps its existing category; boutique mode doesn't show it. */}
      <ProductForm boutique categories={[]} initial={initial} />
    </div>
  );
}
