import { ProductCard } from "./product-card";
import type { CardProduct } from "@/lib/types";

export function ProductGrid({
  products,
  locale,
}: {
  products: CardProduct[];
  locale: string;
}) {
  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">—</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-10">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} locale={locale} />
      ))}
    </div>
  );
}
