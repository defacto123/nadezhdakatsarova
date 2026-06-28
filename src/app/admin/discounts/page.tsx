import { prisma } from "@/lib/prisma";
import { DiscountManager } from "@/components/admin/discount-manager";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const discounts = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="heading-display mb-6 text-3xl">Discount codes</h1>
      <DiscountManager
        discounts={discounts.map((d) => ({
          id: d.id,
          code: d.code,
          type: d.type,
          value: d.value,
          minOrderCents: d.minOrderCents,
          usageLimit: d.usageLimit,
          usedCount: d.usedCount,
          perUserLimit: d.perUserLimit,
          expiresAt: d.expiresAt ? d.expiresAt.toISOString() : null,
          active: d.active,
        }))}
      />
    </div>
  );
}
