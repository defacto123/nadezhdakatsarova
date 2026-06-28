"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { useIsHydrated } from "@/lib/hooks";
import { formatPrice } from "@/lib/money";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const { items, setQuantity, removeItem } = useCart();
  const mounted = useIsHydrated();

  const subtotal = items.reduce(
    (s, i) => s + i.unitPriceCents * i.quantity,
    0,
  );

  if (!mounted) {
    return <div className="container-page py-16" />;
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <h1 className="heading-display text-3xl">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("empty")}</p>
        <Link href="/shop" className={`mt-6 ${buttonVariants()}`}>
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="heading-display mb-8 text-3xl">{t("title")}</h1>
      <div className="grid gap-10 lg:grid-cols-3">
        <ul className="lg:col-span-2 divide-y divide-border">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 py-5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized={item.image.startsWith("data:")}
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-medium">{item.title}</span>
                <span className="text-sm text-muted-foreground">
                  {[item.size, item.color].filter(Boolean).join(" · ")}
                </span>
                <div className="mt-auto flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      className="h-9 w-9"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      className="h-9 w-9"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.key)}
                    className="text-muted-foreground hover:text-red-600"
                    aria-label={t("remove")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <span className="font-semibold">
                  {formatPrice(item.unitPriceCents * item.quantity, locale)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-2xl border border-border bg-white p-6">
          <div className="flex justify-between text-sm">
            <span>{t("subtotal")}</span>
            <span className="font-semibold">
              {formatPrice(subtotal, locale)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("shipping")} — checkout
          </p>
          <Button
            className="mt-5 w-full"
            size="lg"
            onClick={() => router.push("/checkout")}
          >
            {t("checkout")}
          </Button>
          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-primary"
          >
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
