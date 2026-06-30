import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_THEME,
  themeCssVars,
  type ThemeValues,
  type ContentMap,
} from "@/lib/site-design";

export interface ActiveFont {
  id: string;
  family: string;
  url: string;
  format: string;
}

export interface ResolvedTheme extends ThemeValues {
  bodyFont: ActiveFont | null;
  headingFont: ActiveFont | null;
}

const fontFormat = (f: { format: string }) => {
  switch (f.format) {
    case "woff2":
      return "woff2";
    case "woff":
      return "woff";
    case "ttf":
      return "truetype";
    case "otf":
      return "opentype";
    default:
      return f.format;
  }
};

/** Theme + active fonts. Falls back to defaults if missing or DB unavailable. */
export const getResolvedTheme = cache(async (): Promise<ResolvedTheme> => {
  try {
    const theme = await prisma.siteTheme.findUnique({
      where: { id: "default" },
      include: { bodyFont: true, headingFont: true },
    });
    if (!theme) {
      return { ...DEFAULT_THEME, bodyFont: null, headingFont: null };
    }
    return {
      colorBackground: theme.colorBackground,
      colorForeground: theme.colorForeground,
      colorMutedText: theme.colorMutedText,
      colorPrimary: theme.colorPrimary,
      colorPrimaryHover: theme.colorPrimaryHover,
      colorSecondary: theme.colorSecondary,
      colorSecondaryHover: theme.colorSecondaryHover,
      colorAccent: theme.colorAccent,
      colorSurface: theme.colorSurface,
      colorBorder: theme.colorBorder,
      colorSale: theme.colorSale,
      radiusRem: theme.radiusRem,
      brushHue: theme.brushHue,
      brushSaturate: theme.brushSaturate,
      brushOpacity: theme.brushOpacity,
      bodyFont: theme.bodyFont
        ? {
            id: theme.bodyFont.id,
            family: theme.bodyFont.family,
            url: theme.bodyFont.url,
            format: fontFormat(theme.bodyFont),
          }
        : null,
      headingFont: theme.headingFont
        ? {
            id: theme.headingFont.id,
            family: theme.headingFont.family,
            url: theme.headingFont.url,
            format: fontFormat(theme.headingFont),
          }
        : null,
    };
  } catch {
    return { ...DEFAULT_THEME, bodyFont: null, headingFont: null };
  }
});

export const getFontAssets = cache(async () => {
  try {
    return await prisma.fontAsset.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return [];
  }
});

export const getContentMap = cache(async (): Promise<ContentMap> => {
  try {
    const rows = await prisma.contentBlock.findMany();
    const map: ContentMap = {};
    for (const r of rows) map[r.key] = { valueBg: r.valueBg, valueEn: r.valueEn };
    return map;
  } catch {
    return {};
  }
});

export const getSiteImages = cache(
  async (): Promise<Record<string, { url: string; altBg: string | null; altEn: string | null }>> => {
    try {
      const rows = await prisma.siteImage.findMany();
      const map: Record<string, { url: string; altBg: string | null; altEn: string | null }> = {};
      for (const r of rows) map[r.slot] = { url: r.url, altBg: r.altBg, altEn: r.altEn };
      return map;
    } catch {
      return {};
    }
  },
);

export const getHeroSlides = cache(async () => {
  try {
    return await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    return [];
  }
});

export const getSocialLinks = cache(async () => {
  try {
    return await prisma.socialLink.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    return [];
  }
});

const safeFamily = (s: string) => s.replace(/['"\\]/g, "").trim();

/** Build the runtime CSS (font-faces + :root variables) for a resolved theme. */
export function buildThemeCss(theme: ResolvedTheme): string {
  const parts: string[] = [];
  const rootVars: string[] = [themeCssVars(theme)];

  if (theme.bodyFont) {
    const fam = safeFamily(theme.bodyFont.family);
    parts.push(
      `@font-face{font-family:'${fam}';src:url('/api/fonts/${theme.bodyFont.id}') format('${theme.bodyFont.format}');font-display:swap;}`,
    );
    rootVars.push(
      `--font-sans: '${fam}', var(--font-inter), system-ui, sans-serif;`,
    );
  }
  if (theme.headingFont) {
    const fam = safeFamily(theme.headingFont.family);
    parts.push(
      `@font-face{font-family:'${fam}';src:url('/api/fonts/${theme.headingFont.id}') format('${theme.headingFont.format}');font-display:swap;}`,
    );
    rootVars.push(
      `--font-display: '${fam}', var(--font-fraunces), Georgia, serif;`,
    );
  }

  parts.push(`:root{${rootVars.join(" ")}}`);
  return parts.join("\n");
}
