import { formatPrice } from "@/lib/money";

const BRAND = "#c4633f";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#fbf7f0;font-family:Arial,Helvetica,sans-serif;color:#2b2622">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px">
      <h1 style="font-size:22px;color:${BRAND};margin:0 0 8px">Nadezhda Katsarova</h1>
      <h2 style="font-size:18px;margin:0 0 16px">${title}</h2>
      ${body}
      <hr style="border:none;border-top:1px solid #e6dccb;margin:28px 0"/>
      <p style="font-size:12px;color:#6b6258">
        <a href="${SITE}" style="color:${BRAND}">${SITE.replace(/^https?:\/\//, "")}</a>
        · Everything made with love.
      </p>
    </div>
  </body></html>`;
}

export function orderConfirmationEmail(order: {
  number: number;
  email: string;
  items: { titleSnapshot: string; variantSnapshot: string | null; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}): { subject: string; html: string } {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0">${i.titleSnapshot}${
          i.variantSnapshot ? ` <span style="color:#6b6258">(${i.variantSnapshot})</span>` : ""
        } × ${i.quantity}</td>
        <td style="padding:8px 0;text-align:right">${formatPrice(
          i.unitPriceCents * i.quantity,
        )}</td>
      </tr>`,
    )
    .join("");

  const body = `
    <p style="font-size:15px">Thank you for your order <strong>#${order.number}</strong>! We're getting it ready.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
      ${rows}
      <tr><td style="padding-top:12px">Subtotal</td><td style="padding-top:12px;text-align:right">${formatPrice(order.subtotalCents)}</td></tr>
      ${order.discountCents > 0 ? `<tr><td>Discount</td><td style="text-align:right;color:${BRAND}">- ${formatPrice(order.discountCents)}</td></tr>` : ""}
      <tr><td>Shipping</td><td style="text-align:right">${order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents)}</td></tr>
      <tr><td style="padding-top:8px;font-weight:bold">Total</td><td style="padding-top:8px;text-align:right;font-weight:bold">${formatPrice(order.totalCents)}</td></tr>
    </table>`;

  return {
    subject: `Order #${order.number} confirmed`,
    html: shell("Your order is confirmed", body),
  };
}

export function welcomeEmail(): { subject: string; html: string } {
  return {
    subject: "Welcome — here's your 10% off",
    html: shell(
      "Welcome to the studio!",
      `<p style="font-size:15px">Thanks for subscribing. Use code <strong style="color:${BRAND}">WELCOME10</strong> for 10% off your first order.</p>`,
    ),
  };
}
