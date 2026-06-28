import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribe } from "@/lib/marketing";
import { sendEmail } from "@/lib/resend";
import { welcomeEmail } from "@/lib/email-templates";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  const result = await subscribe(parsed.data.email);
  if (result.status === "subscribed") {
    const { subject, html } = welcomeEmail();
    await sendEmail({ to: parsed.data.email, subject, html });
  }
  return NextResponse.json({ status: result.status });
}
