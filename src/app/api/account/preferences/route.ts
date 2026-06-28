import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { subscribe, unsubscribe } from "@/lib/marketing";

const schema = z.object({ marketingConsent: z.boolean() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (parsed.data.marketingConsent) {
    await subscribe(user.email, user.id);
  } else {
    await unsubscribe(user.email);
  }

  return NextResponse.json({ ok: true });
}
