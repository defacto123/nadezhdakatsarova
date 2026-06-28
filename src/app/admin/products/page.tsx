import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, variants: true, images: { take: 1 } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="heading-display text-3xl">Products</h1>
        <Link href="/admin/products/new" className={buttonVariants()}>
          + New product
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => {
              const stock =
                p.variants.length === 0
                  ? "—"
                  : p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {p.titleEn}
                    </Link>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">{p.category.nameEn}</td>
                  <td className="px-4 py-3">
                    {formatPrice(p.priceCents)}
                    {p.salePercent ? (
                      <Badge variant="sale" className="ml-2">
                        -{p.salePercent}%
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{stock}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.active ? "success" : "neutral"}>
                      {p.active ? "Active" : "Hidden"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
