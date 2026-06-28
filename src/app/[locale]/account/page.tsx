import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AccountClient } from "@/components/account/account-client";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/sign-in?callbackUrl=/account`);
  }

  const [user, orders] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  if (!user) redirect(`/${locale}/sign-in`);

  return (
    <AccountClient
      locale={locale}
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        marketingConsent: user.marketingConsent,
      }}
      orders={orders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        totalCents: o.totalCents,
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      }))}
    />
  );
}
