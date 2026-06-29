import { prisma } from "@/lib/prisma";
import { FontManager } from "@/components/admin/site-design/font-manager";

export const dynamic = "force-dynamic";

export default async function FontsPage() {
  const [fonts, theme] = await Promise.all([
    prisma.fontAsset.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.siteTheme.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <div>
      <h1 className="heading-display text-3xl">Fonts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload custom fonts, preview them, and assign which font is used for body
        text and which for headings.
      </p>
      <div className="mt-8">
        <FontManager
          fonts={fonts.map((f) => ({
            id: f.id,
            label: f.label,
            family: f.family,
            url: f.url,
            format: f.format,
          }))}
          bodyFontId={theme?.bodyFontId ?? null}
          headingFontId={theme?.headingFontId ?? null}
        />
      </div>
    </div>
  );
}
