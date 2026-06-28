import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { priceOrder } from "@/lib/checkout";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const schema = z.object({
  email: z.string().email(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().nullable(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  discountCode: z.string().optional().nullable(),
  shippingRateId: z.string().optional().nullable(),
  shipping: z.object({
    name: z.string().min(1),
    phone: z.string().optional().nullable(),
    line1: z.string().min(1),
    line2: z.string().optional().nullable(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2),
  }),
});

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const data = parsed.data;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const priced = await priceOrder({
    items: data.items,
    discountCode: data.discountCode,
    shippingRateId: data.shippingRateId,
    userId,
  });

  if (priced.lines.length === 0) {
    return NextResponse.json(
      { error: "No purchasable items", details: priced.errors },
      { status: 400 },
    );
  }

  const order = await prisma.order.create({
    data: {
      userId,
      email: data.email.toLowerCase(),
      status: "PENDING",
      subtotalCents: priced.subtotalCents,
      discountCents: priced.discountCents,
      shippingCents: priced.shippingCents,
      totalCents: priced.totalCents,
      discountCodeId: priced.discountCodeId,
      shippingName: data.shipping.name,
      shippingPhone: data.shipping.phone ?? null,
      shippingLine1: data.shipping.line1,
      shippingLine2: data.shipping.line2 ?? null,
      shippingCity: data.shipping.city,
      shippingPostalCode: data.shipping.postalCode,
      shippingCountry: data.shipping.country,
      items: {
        create: priced.lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          titleSnapshot: l.titleSnapshot,
          variantSnapshot: l.variantSnapshot,
          unitPriceCents: l.unitPriceCents,
          quantity: l.quantity,
        })),
      },
    },
  });

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: priced.totalCents,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    receipt_email: order.email,
    metadata: { orderId: order.id, orderNumber: String(order.number) },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: intent.id },
  });

  return NextResponse.json({
    clientSecret: intent.client_secret,
    orderId: order.id,
    orderNumber: order.number,
    totals: {
      subtotalCents: priced.subtotalCents,
      discountCents: priced.discountCents,
      shippingCents: priced.shippingCents,
      totalCents: priced.totalCents,
    },
  });
}
