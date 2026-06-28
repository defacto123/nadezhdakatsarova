import { setRequestLocale } from "next-intl/server";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container-page max-w-3xl py-16 prose-sm">
      <h1 className="heading-display text-4xl">
        {locale === "en" ? "Privacy Policy" : "Политика за поверителност"}
      </h1>
      <p className="mt-6 text-muted-foreground">
        {locale === "en"
          ? "We respect your privacy. We use your data only to process orders and, with your consent, to send marketing emails. You can unsubscribe at any time via the link in any email."
          : "Уважаваме вашата поверителност. Използваме данните ви само за обработка на поръчки и, с вашето съгласие, за изпращане на маркетингови имейли. Можете да се отпишете по всяко време чрез линка във всеки имейл."}
      </p>
    </div>
  );
}
