import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { OrderStatusControl } from "@/components/admin/order-status-control";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, discountCode: true },
  });
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/orders" className="text-sm text-primary">
        ← All orders
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h1 className="heading-display text-3xl">Order #{order.number}</h1>
        <OrderStatusControl id={order.id} status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5 text-sm">
          <h2 className="mb-3 font-semibold">Customer</h2>
          <p>{order.email}</p>
          <p className="mt-3 font-medium">{order.shippingName}</p>
          <p className="text-muted-foreground">
            {order.shippingPhone}
            <br />
            {order.shippingLine1}
            {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
            <br />
            {order.shippingPostalCode} {order.shippingCity}
            <br />
            {order.shippingCountry}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 text-sm">
          <h2 className="mb-3 font-semibold">Payment</h2>
          <p className="text-muted-foreground">
            Stripe PI: {order.stripePaymentIntentId ?? "—"}
          </p>
          <p className="mt-2">
            Placed: {order.createdAt.toLocaleString()}
          </p>
          {order.discountCode && (
            <p className="mt-2">Code: {order.discountCode.code}</p>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-3">
                  {i.titleSnapshot}
                  {i.variantSnapshot ? (
                    <span className="text-muted-foreground"> ({i.variantSnapshot})</span>
                  ) : null}
                </td>
                <td className="px-4 py-3">{i.quantity}</td>
                <td className="px-4 py-3 text-right">
                  {formatPrice(i.unitPriceCents * i.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-1 border-t border-border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-primary">
              <span>Discount</span>
              <span>- {formatPrice(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{formatPrice(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between pt-1 font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
