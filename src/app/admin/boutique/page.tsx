import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { BoutiqueManager } from "@/components/admin/boutique-manager";
import { isBoutiqueMode } from "@/lib/site-mode";

export const dynamic = "force-dynamic";

export default async function AdminBoutiquePage() {
  const [items, others] = await Promise.all([
    prisma.product.findMany({
      where: { inBoutique: true },
      orderBy: [{ boutiqueSortOrder: "asc" }, { createdAt: "desc" }],
      include: { variants: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    prisma.product.findMany({
      where: { inBoutique: false },
      orderBy: { titleEn: "asc" },
      select: { id: true, titleEn: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="heading-display text-3xl">Boutique</h1>
        <Link href="/admin/boutique/new" className={buttonVariants()}>
          + New item
        </Link>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        A single catalog shown as one feed on the home page, in this order (top
        = first). Visible on the store only while boutique mode is on
        (<code>SITE_MODE=boutique</code>) — currently{" "}
        <strong>{isBoutiqueMode() ? "ON" : "OFF"}</strong>.
      </p>

      <BoutiqueManager
        items={items.map((p) => ({
          id: p.id,
          slug: p.slug,
          titleEn: p.titleEn,
          titleBg: p.titleBg,
          priceCents: p.priceCents,
          salePercent: p.salePercent,
          active: p.active,
          image: p.images[0]?.url ?? null,
          stock:
            p.variants.length === 0
              ? null
              : p.variants.reduce((s, v) => s + v.stock, 0),
        }))}
        others={others}
      />
    </div>
  );
}
