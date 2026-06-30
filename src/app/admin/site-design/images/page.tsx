import { prisma } from "@/lib/prisma";
import {
  ImageSlotManager,
  type ImageRow,
} from "@/components/admin/site-design/image-slot-manager";

export const dynamic = "force-dynamic";

export default async function ImagesPage() {
  const rows = await prisma.siteImage.findMany();
  const images: Record<string, ImageRow> = {};
  for (const r of rows) {
    images[r.slot] = {
      url: r.url,
      altBg: r.altBg,
      altEn: r.altEn,
      animated: r.animated,
      motion: r.motion,
      speed: r.speed,
      bgColor: r.bgColor,
    };
  }

  return (
    <div>
      <h1 className="heading-display text-3xl">Images</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Replace the photos used across the site. Each slot enforces exact
        dimensions — the required size is shown on every card.
      </p>
      <div className="mt-8">
        <ImageSlotManager images={images} />
      </div>
    </div>
  );
}
