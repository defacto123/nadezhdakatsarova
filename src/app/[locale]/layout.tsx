import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getTopLevelCategories } from "@/lib/catalog";
import {
  getContentMap,
  getSiteImages,
  getSocialLinks,
} from "@/lib/site-settings";
import { contentValue } from "@/lib/site-design";
import { pick } from "@/lib/content";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { Analytics } from "@/components/analytics/ga";
import { ConsentBanner } from "@/components/analytics/consent-banner";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const content = await getContentMap();
  const title = contentValue(content, "seo.title", locale);
  const description = contentValue(content, "seo.description", locale);
  const brand = contentValue(content, "brand.logoLine1", locale);
  return {
    title: { default: title, template: `%s — ${brand}` },
    description,
  };
}

async function safeCategories() {
  try {
    return await getTopLevelCategories();
  } catch {
    return [];
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [categories, content, images, socials] = await Promise.all([
    safeCategories(),
    getContentMap(),
    getSiteImages(),
    getSocialLinks(),
  ]);

  const brandLine1 = contentValue(content, "brand.logoLine1", locale);
  const brandLine2 = contentValue(content, "brand.logoLine2", locale);
  const logoImage = images["logo"];
  const logo = logoImage
    ? {
        url: logoImage.url,
        alt: pick(locale, logoImage.altBg, logoImage.altEn) || brandLine1,
      }
    : null;

  return (
    <NextIntlClientProvider>
      <Analytics />
      <AnnouncementBar text={contentValue(content, "announcement.text", locale)} />
      <Header
        locale={locale}
        categories={categories.map((c) => ({
          slug: c.slug,
          nameBg: c.nameBg,
          nameEn: c.nameEn,
        }))}
        brand={{ line1: brandLine1, line2: brandLine2 }}
        logo={logo}
        brushUrl={images["header-brush"]?.url ?? "/brand/header-brush.png"}
      />
      <main className="flex-1">{children}</main>
      <Footer
        newsletterTitle={contentValue(content, "newsletter.title", locale)}
        newsletterSubtitle={contentValue(content, "newsletter.subtitle", locale)}
        blurb={contentValue(content, "footer.blurb", locale)}
        socials={socials.map((s) => ({ platform: s.platform, url: s.url }))}
      />
      <ConsentBanner />
    </NextIntlClientProvider>
  );
}
