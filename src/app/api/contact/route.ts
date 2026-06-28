import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, FROM_EMAIL } from "@/lib/resend";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { name, email, message } = parsed.data;

  // Forward the message to the shop owner (uses configured from address as recipient too).
  await sendEmail({
    to: FROM_EMAIL.replace(/.*<(.+)>.*/, "$1"),
    subject: `Contact form: ${name}`,
    html: `<p><strong>${name}</strong> (${email})</p><p>${message.replace(/\n/g, "<br/>")}</p>`,
  });

  return NextResponse.json({ ok: true });
}
