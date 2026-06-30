import { prisma } from "@/lib/prisma";
import {
  HeroManager,
  type HeroSlideData,
} from "@/components/admin/site-design/hero-manager";

export const dynamic = "force-dynamic";

export default async function HeroPage() {
  const rows = await prisma.heroSlide.findMany({ orderBy: { sortOrder: "asc" } });
  const slides: HeroSlideData[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    imageUrl: r.imageUrl,
    imageUrl2: r.imageUrl2,
    href: r.href,
    motion1: r.motion1,
    speed1: r.speed1,
    animated1: r.animated1,
    motion2: r.motion2,
    speed2: r.speed2,
    animated2: r.animated2,
    bgColor: r.bgColor,
    sortOrder: r.sortOrder,
    active: r.active,
  }));

  return (
    <div>
      <h1 className="heading-display text-3xl">Hero slides</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The rotating banner on the homepage. Each slide is either one big image
        (fade in) or a pair of images that slide in from the edges and gather in
        the centre. Images are clickable and redirect to the URL you set.
      </p>
      <div className="mt-8">
        <HeroManager slides={slides} />
      </div>
    </div>
  );
}
