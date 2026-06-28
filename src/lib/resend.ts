import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Boutique <onboarding@resend.dev>";

export const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "";

/** Send a transactional email; no-ops (logs) when Resend is not configured. */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[resend] not configured, skipping email:", opts.subject);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err) {
    console.error("[resend] send failed", err);
  }
}
