import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { ensureBoutiqueCategory } from "@/lib/admin-product";

export const dynamic = "force-dynamic";

export default async function NewBoutiqueItemPage() {
  const category = await ensureBoutiqueCategory();

  return (
    <div>
      <Link href="/admin/boutique" className="text-sm text-muted-foreground hover:text-primary">
        ← Boutique
      </Link>
      <h1 className="heading-display mb-6 mt-2 text-3xl">New boutique item</h1>
      <ProductForm
        boutique
        categories={[{ id: category.id, nameEn: category.nameEn }]}
      />
    </div>
  );
}
