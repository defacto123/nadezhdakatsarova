import { prisma } from "@/lib/prisma";
import { CampaignComposer } from "@/components/admin/campaign-composer";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  const [campaigns, recipientCount] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.newsletterSubscriber.count({
      where: { unsubscribed: false, consent: true },
    }),
  ]);

  return (
    <div>
      <h1 className="heading-display mb-6 text-3xl">Email campaigns</h1>
      <CampaignComposer
        recipientCount={recipientCount}
        campaigns={campaigns.map((c) => ({
          id: c.id,
          subject: c.subject,
          status: c.status,
          recipientCount: c.recipientCount,
          sentAt: c.sentAt ? c.sentAt.toISOString() : null,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
