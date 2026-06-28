import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getTopLevelCategories } from "@/lib/catalog";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { Analytics } from "@/components/analytics/ga";
import { ConsentBanner } from "@/components/analytics/consent-banner";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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

  const categories = await safeCategories();

  return (
    <NextIntlClientProvider>
      <Analytics />
      <AnnouncementBar />
      <Header
        locale={locale}
        categories={categories.map((c) => ({
          slug: c.slug,
          nameBg: c.nameBg,
          nameEn: c.nameEn,
        }))}
      />
      <main className="flex-1">{children}</main>
      <Footer />
      <ConsentBanner />
    </NextIntlClientProvider>
  );
}
