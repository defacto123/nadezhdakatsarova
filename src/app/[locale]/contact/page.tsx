import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/storefront/contact-form";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <div className="container-page max-w-xl py-16">
      <h1 className="heading-display text-4xl">{t("contact")}</h1>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
