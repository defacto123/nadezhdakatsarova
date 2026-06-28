import { NextResponse } from "next/server";
import { z } from "zod";
import { unsubscribe } from "@/lib/marketing";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const result = await unsubscribe(parsed.data.email);
  return NextResponse.json({ status: result.status });
}
