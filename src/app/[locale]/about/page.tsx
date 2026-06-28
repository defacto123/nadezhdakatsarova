import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="heading-display text-4xl">{t("artistTitle")}</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        {t("artistText")}
      </p>
    </div>
  );
}
