import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ClearCart } from "@/components/checkout/clear-cart";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  const { locale } = await params;
  const { payment_intent } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  let orderNumber: number | null = null;
  let totalCents = 0;
  if (payment_intent) {
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: payment_intent },
    });
    if (order) {
      orderNumber = order.number;
      totalCents = order.totalCents;
    }
  }

  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <ClearCart value={totalCents / 100} orderNumber={orderNumber ?? undefined} />
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage text-3xl text-white">
        ✓
      </div>
      <h1 className="heading-display text-3xl">{t("thankYou")}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {orderNumber
          ? t("orderConfirmed", { number: `#${orderNumber}` })
          : t("orderConfirmed", { number: "" })}
      </p>
      <Link href="/shop" className={`mt-8 ${buttonVariants()}`}>
        {t("backToShop")}
      </Link>
    </div>
  );
}
