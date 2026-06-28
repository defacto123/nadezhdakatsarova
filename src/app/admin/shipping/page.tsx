import { prisma } from "@/lib/prisma";
import { ShippingManager } from "@/components/admin/shipping-manager";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const zones = await prisma.shippingZone.findMany({
    orderBy: { sortOrder: "asc" },
    include: { rates: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div>
      <h1 className="heading-display mb-6 text-3xl">Shipping</h1>
      <ShippingManager
        zones={zones.map((z) => ({
          id: z.id,
          name: z.name,
          countries: z.countries,
          rates: z.rates.map((r) => ({
            id: r.id,
            name: r.name,
            priceCents: r.priceCents,
            freeOverCents: r.freeOverCents,
          })),
        }))}
      />
    </div>
  );
}
