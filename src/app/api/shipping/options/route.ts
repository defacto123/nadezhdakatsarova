import { NextResponse } from "next/server";
import { z } from "zod";
import { priceOrder, getShippingOptions } from "@/lib/checkout";

const schema = z.object({
  country: z.string().min(2),
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

  const priced = await priceOrder({ items: parsed.data.items });
  const options = await getShippingOptions(
    parsed.data.country,
    priced.subtotalCents,
  );
  return NextResponse.json({ options, subtotalCents: priced.subtotalCents });
}
