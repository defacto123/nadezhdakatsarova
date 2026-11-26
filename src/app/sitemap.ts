import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { isBoutiqueMode } from "@/lib/site-mode";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const boutique = isBoutiqueMode();
  const staticPaths = boutique
    ? ["", "/about", "/contact"]
    : ["", "/shop", "/about", "/contact"];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    for (const p of staticPaths) {
      entries.push({ url: `${base}${prefix}${p || "/"}`, changeFrequency: "weekly" });
    }
  }

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: boutique ? { active: true, inBoutique: true } : { active: true },
        select: { slug: true, updatedAt: true },
      }),
      boutique
        ? Promise.resolve([])
        : prisma.category.findMany({ where: { active: true }, select: { slug: true } }),
    ]);
    for (const locale of routing.locales) {
      const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      for (const c of categories) {
        entries.push({ url: `${base}${prefix}/category/${c.slug}` });
      }
      for (const p of products) {
        entries.push({
          url: `${base}${prefix}/product/${p.slug}`,
          lastModified: p.updatedAt,
        });
      }
    }
  } catch {
    // DB unavailable at build time — return static entries only.
  }

  return entries;
}
