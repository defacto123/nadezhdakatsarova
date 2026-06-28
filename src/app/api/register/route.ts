import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { subscribe } from "@/lib/marketing";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  marketingConsent: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { name, email, password, marketingConsent } = parsed.data;
  const normalized = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email: normalized,
      passwordHash,
      marketingConsent: Boolean(marketingConsent),
    },
  });

  if (marketingConsent) {
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    await subscribe(normalized, user?.id);
  }

  return NextResponse.json({ ok: true });
}
