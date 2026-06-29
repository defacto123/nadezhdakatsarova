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
    eyebrowBg: r.eyebrowBg,
    eyebrowEn: r.eyebrowEn,
    headlineBg: r.headlineBg,
    headlineEn: r.headlineEn,
    subtextBg: r.subtextBg,
    subtextEn: r.subtextEn,
    imageUrl: r.imageUrl,
    ctaLabelBg: r.ctaLabelBg,
    ctaLabelEn: r.ctaLabelEn,
    ctaHref: r.ctaHref,
    sortOrder: r.sortOrder,
    active: r.active,
  }));

  return (
    <div>
      <h1 className="heading-display text-3xl">Hero slides</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The rotating banner on the homepage. Add slides with bilingual text, an
        optional image and a call-to-action button.
      </p>
      <div className="mt-8">
        <HeroManager slides={slides} />
      </div>
    </div>
  );
}
