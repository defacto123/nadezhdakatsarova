"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import { buttonVariants, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/money";

interface OrderRow {
  id: string;
  number: number;
  status: string;
  totalCents: number;
  createdAt: string;
  itemCount: number;
}

export function AccountClient({
  locale,
  user,
  orders,
}: {
  locale: string;
  user: {
    name: string | null;
    email: string;
    role: string;
    marketingConsent: boolean;
  };
  orders: OrderRow[];
}) {
  const t = useTranslations("account");
  const tc = useTranslations("checkout");
  const [consent, setConsent] = useState(user.marketingConsent);
  const [saved, setSaved] = useState(false);

  async function savePreferences() {
    await fetch("/api/account/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketingConsent: consent }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="heading-display text-3xl">{t("title")}</h1>
        <div className="flex items-center gap-3">
          {user.role === "ADMIN" && (
            <NextLink
              href="/admin"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Admin
            </NextLink>
          )}
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: `/${locale}` })}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">
            {t("orders")}
          </h2>
          {orders.length === 0 ? (
            <p className="text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-border bg-white">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-4 text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {t("orderNumber")} #{o.number}
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()} · {o.itemCount} ×
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={o.status === "PAID" || o.status === "FULFILLED" ? "success" : "neutral"}>
                      {o.status}
                    </Badge>
                    <span className="font-semibold">
                      {formatPrice(o.totalCents, locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            {t("profile")}
          </h2>
          <p className="text-sm">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>

          <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide">
            {t("preferences")}
          </h2>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            {t("subscribed")}
          </label>
          <Button size="sm" className="mt-4" onClick={savePreferences}>
            {saved ? t("saved") : t("save")}
          </Button>

          <div className="mt-6 border-t border-border pt-4 text-sm">
            <Link href="/shop" className="text-primary hover:underline">
              {tc("backToShop")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
