import { prisma } from "@/lib/prisma";
import {
  SocialManager,
  type SocialLinkData,
} from "@/components/admin/site-design/social-manager";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const rows = await prisma.socialLink.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const links: SocialLinkData[] = rows.map((r) => ({
    id: r.id,
    platform: r.platform,
    url: r.url,
    sortOrder: r.sortOrder,
    active: r.active,
  }));

  return (
    <div>
      <h1 className="heading-display text-3xl">Social links</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Links shown in the footer. Add your Instagram, Facebook, TikTok and more.
      </p>
      <div className="mt-8">
        <SocialManager links={links} />
      </div>
    </div>
  );
}
