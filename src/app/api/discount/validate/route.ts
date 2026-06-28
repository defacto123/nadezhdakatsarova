import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { priceOrder } from "@/lib/checkout";

const schema = z.object({
  code: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().nullable(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const session = await auth();
  const priced = await priceOrder({
    items: parsed.data.items,
    discountCode: parsed.data.code,
    userId: session?.user?.id ?? null,
  });

  if (priced.discountError) {
    return NextResponse.json(
      { valid: false, reason: priced.discountError },
      { status: 200 },
    );
  }
  return NextResponse.json({
    valid: true,
    discountCents: priced.discountCents,
    subtotalCents: priced.subtotalCents,
  });
}
