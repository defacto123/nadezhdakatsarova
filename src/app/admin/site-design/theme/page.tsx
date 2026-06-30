import { prisma } from "@/lib/prisma";
import { DEFAULT_THEME } from "@/lib/site-design";
import { ThemeEditor } from "@/components/admin/site-design/theme-editor";
import type { SiteThemeInput } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function ThemePage() {
  const [row, fonts, brush] = await Promise.all([
    prisma.siteTheme.findUnique({ where: { id: "default" } }),
    prisma.fontAsset.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.siteImage.findUnique({ where: { slot: "header-brush" } }),
  ]);

  const initial: SiteThemeInput = {
    colorBackground: row?.colorBackground ?? DEFAULT_THEME.colorBackground,
    colorForeground: row?.colorForeground ?? DEFAULT_THEME.colorForeground,
    colorMutedText: row?.colorMutedText ?? DEFAULT_THEME.colorMutedText,
    colorPrimary: row?.colorPrimary ?? DEFAULT_THEME.colorPrimary,
    colorPrimaryHover: row?.colorPrimaryHover ?? DEFAULT_THEME.colorPrimaryHover,
    colorSecondary: row?.colorSecondary ?? DEFAULT_THEME.colorSecondary,
    colorSecondaryHover:
      row?.colorSecondaryHover ?? DEFAULT_THEME.colorSecondaryHover,
    colorAccent: row?.colorAccent ?? DEFAULT_THEME.colorAccent,
    colorSurface: row?.colorSurface ?? DEFAULT_THEME.colorSurface,
    colorBorder: row?.colorBorder ?? DEFAULT_THEME.colorBorder,
    colorSale: row?.colorSale ?? DEFAULT_THEME.colorSale,
    radiusRem: row?.radiusRem ?? DEFAULT_THEME.radiusRem,
    brushHue: row?.brushHue ?? DEFAULT_THEME.brushHue,
    brushSaturate: row?.brushSaturate ?? DEFAULT_THEME.brushSaturate,
    brushOpacity: row?.brushOpacity ?? DEFAULT_THEME.brushOpacity,
    bodyFontId: row?.bodyFontId ?? null,
    headingFontId: row?.headingFontId ?? null,
  };

  const brushUrl = brush?.url ?? "/brand/header-brush.png";

  return (
    <div>
      <h1 className="heading-display text-3xl">Theme &amp; colours</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick your palette with the colour pickers. Changes apply across the
        whole storefront after saving.
      </p>
      <div className="mt-8">
        <ThemeEditor
          initial={initial}
          fonts={fonts.map((f) => ({ id: f.id, label: f.label, family: f.family }))}
          brushUrl={brushUrl}
        />
      </div>
    </div>
  );
}
