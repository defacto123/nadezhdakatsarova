import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [productCount, orderCount, paidAgg, subscriberCount, recentOrders, lowStock] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalCents: true },
        where: { status: { in: ["PAID", "FULFILLED"] } },
      }),
      prisma.newsletterSubscriber.count({ where: { unsubscribed: false } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 3 } },
        include: { product: true },
        orderBy: { stock: "asc" },
        take: 8,
      }),
    ]);

  const stats = [
    { label: "Revenue", value: formatPrice(paidAgg._sum.totalCents ?? 0) },
    { label: "Orders", value: orderCount },
    { label: "Products", value: productCount },
    { label: "Subscribers", value: subscriberCount },
  ];

  return (
    <div>
      <h1 className="heading-display mb-6 text-3xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-white p-5"
          >
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary">
              All →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between py-2 text-sm hover:text-primary"
              >
                <span>#{o.number} · {o.email}</span>
                <span className="flex items-center gap-2">
                  <Badge
                    variant={
                      o.status === "PAID" || o.status === "FULFILLED"
                        ? "success"
                        : o.status === "CANCELLED"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {o.status}
                  </Badge>
                  {formatPrice(o.totalCents)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-4 font-semibold">Low stock</h2>
          <div className="divide-y divide-border">
            {lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All stock levels are healthy.
              </p>
            )}
            {lowStock.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span>
                  {v.product.titleEn}{" "}
                  <span className="text-muted-foreground">
                    {[v.size, v.color].filter(Boolean).join(" / ")}
                  </span>
                </span>
                <Badge variant={v.stock === 0 ? "danger" : "warning"}>
                  {v.stock} left
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
