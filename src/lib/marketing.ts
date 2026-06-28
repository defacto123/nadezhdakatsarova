import { prisma } from "@/lib/prisma";
import { getResend, AUDIENCE_ID, FROM_EMAIL } from "@/lib/resend";

/** Subscribe an email: persist locally and (if configured) sync to Resend audience. */
export async function subscribe(email: string, userId?: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalized },
  });
  if (existing && !existing.unsubscribed) {
    return { status: "already" as const, subscriber: existing };
  }

  let resendContactId = existing?.resendContactId ?? null;
  const resend = getResend();
  if (resend && AUDIENCE_ID) {
    try {
      const res = await resend.contacts.create({
        email: normalized,
        unsubscribed: false,
        audienceId: AUDIENCE_ID,
      });
      resendContactId = res.data?.id ?? resendContactId;
    } catch (err) {
      console.error("[marketing] resend contact create failed", err);
    }
  }

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email: normalized },
    create: { email: normalized, consent: true, resendContactId, userId },
    update: { unsubscribed: false, consent: true, resendContactId },
  });

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { marketingConsent: true },
    });
  }

  return { status: "subscribed" as const, subscriber };
}

export async function unsubscribe(email: string) {
  const normalized = email.trim().toLowerCase();
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalized },
  });
  if (!subscriber) return { status: "notfound" as const };

  const resend = getResend();
  if (resend && AUDIENCE_ID && subscriber.resendContactId) {
    try {
      await resend.contacts.update({
        id: subscriber.resendContactId,
        audienceId: AUDIENCE_ID,
        unsubscribed: true,
      });
    } catch (err) {
      console.error("[marketing] resend unsubscribe failed", err);
    }
  }

  await prisma.newsletterSubscriber.update({
    where: { email: normalized },
    data: { unsubscribed: true },
  });
  if (subscriber.userId) {
    await prisma.user.update({
      where: { id: subscriber.userId },
      data: { marketingConsent: false },
    });
  }
  return { status: "unsubscribed" as const };
}

/** Create + send a marketing broadcast via Resend to the whole audience. */
export async function sendCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");

  const resend = getResend();
  if (!resend || !AUDIENCE_ID) {
    throw new Error(
      "Resend is not configured (RESEND_API_KEY / RESEND_AUDIENCE_ID).",
    );
  }

  const recipientCount = await prisma.newsletterSubscriber.count({
    where: { unsubscribed: false, consent: true },
  });

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "SENDING", recipientCount },
  });

  try {
    const created = await resend.broadcasts.create({
      audienceId: AUDIENCE_ID,
      from: FROM_EMAIL,
      subject: campaign.subject,
      html: campaign.bodyHtml,
      name: campaign.subject,
    });
    const broadcastId = created.data?.id;
    if (!broadcastId) throw new Error("No broadcast id returned");

    await resend.broadcasts.send(broadcastId);

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "SENT",
        resendBroadcastId: broadcastId,
        sentAt: new Date(),
      },
    });
    return { broadcastId, recipientCount };
  } catch (err) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "FAILED" },
    });
    throw err;
  }
}
