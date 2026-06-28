"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { useIsHydrated } from "@/lib/hooks";
import { formatPrice } from "@/lib/money";
import { trackEvent } from "@/components/analytics/ga";
import { PaymentStep } from "./payment-step";

const COUNTRIES = [
  { code: "BG", name: "България / Bulgaria" },
  { code: "RO", name: "Romania" },
  { code: "GR", name: "Greece" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "AT", name: "Austria" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "OTHER", name: "Other" },
];

interface ShipOption {
  id: string;
  name: string;
  priceCents: number;
}

export function CheckoutClient({ siteUrl }: { siteUrl: string }) {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const items = useCart((s) => s.items);

  const mounted = useIsHydrated();
  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("BG");

  const [code, setCode] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [codeMsg, setCodeMsg] = useState<string | null>(null);

  const [options, setOptions] = useState<ShipOption[]>([]);
  const [rateId, setRateId] = useState<string | null>(null);

  const apiItems = useMemo(
    () =>
      items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    [items],
  );

  const subtotal = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const shipping = options.find((o) => o.id === rateId)?.priceCents ?? 0;
  const total = Math.max(0, subtotal - discountCents + shipping);

  // Load shipping options whenever country/cart changes.
  useEffect(() => {
    if (!mounted || apiItems.length === 0) return;
    let active = true;
    fetch("/api/shipping/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, items: apiItems }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const opts: ShipOption[] = data.options ?? [];
        setOptions(opts);
        setRateId(opts[0]?.id ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [country, apiItems, mounted]);

  useEffect(() => {
    if (mounted && items.length === 0 && step === "details") {
      router.replace("/cart");
    }
  }, [mounted, items.length, step, router]);

  async function applyCode() {
    if (!code) return;
    const res = await fetch("/api/discount/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, items: apiItems }),
    });
    const data = await res.json();
    if (data.valid) {
      setDiscountCents(data.discountCents);
      setCodeMsg(tc("codeApplied"));
    } else {
      setDiscountCents(0);
      setCodeMsg(tc("codeInvalid"));
    }
  }

  async function continueToPayment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items: apiItems,
          discountCode: code || null,
          shippingRateId: rateId,
          shipping: { name, phone, line1, line2, city, postalCode, country },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Error");
        setSubmitting(false);
        return;
      }
      trackEvent("begin_checkout", {
        currency: "EUR",
        value: data.totals.totalCents / 100,
      });
      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return <div className="container-page py-16" />;

  return (
    <div className="container-page py-10">
      <h1 className="heading-display mb-8 text-3xl">{t("title")}</h1>
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === "details" ? (
            <form onSubmit={continueToPayment} className="space-y-8">
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
                  {t("contact")}
                </h2>
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                  {t("shippingAddress")}
                </h2>
                <div>
                  <Label htmlFor="name">{t("fullName")}</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="line1">{t("address1")}</Label>
                  <Input
                    id="line1"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="line2">{t("address2")}</Label>
                  <Input
                    id="line2"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">{t("city")}</Label>
                    <Input
                      id="city"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal">{t("postalCode")}</Label>
                    <Input
                      id="postal"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="country">{t("country")}</Label>
                  <Select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </section>

              {options.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide">
                    {t("shippingMethod")}
                  </h2>
                  {options.map((o) => (
                    <label
                      key={o.id}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-white px-4 py-3"
                    >
                      <span className="flex items-center gap-3 text-sm">
                        <input
                          type="radio"
                          name="rate"
                          checked={rateId === o.id}
                          onChange={() => setRateId(o.id)}
                        />
                        {o.name}
                      </span>
                      <span className="text-sm font-medium">
                        {o.priceCents === 0
                          ? t("free")
                          : formatPrice(o.priceCents, locale)}
                      </span>
                    </label>
                  ))}
                </section>
              )}

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? t("placingOrder") : t("payNow")}
              </Button>
            </form>
          ) : (
            clientSecret && (
              <PaymentStep clientSecret={clientSecret} siteUrl={siteUrl} />
            )
          )}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">
            {t("orderSummary")}
          </h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-2">
                <span className="text-muted-foreground">
                  {i.title} × {i.quantity}
                </span>
                <span>{formatPrice(i.unitPriceCents * i.quantity, locale)}</span>
              </li>
            ))}
          </ul>

          {step === "details" && (
            <div className="mt-4 flex gap-2">
              <Input
                placeholder={tc("codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <Button type="button" variant="outline" onClick={applyCode}>
                {tc("applyCode")}
              </Button>
            </div>
          )}
          {codeMsg && (
            <p className="mt-1 text-xs text-muted-foreground">{codeMsg}</p>
          )}

          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span>{tc("subtotal")}</span>
              <span>{formatPrice(subtotal, locale)}</span>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between text-primary">
                <span>{tc("discount")}</span>
                <span>- {formatPrice(discountCents, locale)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{tc("shipping")}</span>
              <span>
                {shipping === 0 ? t("free") : formatPrice(shipping, locale)}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold">
              <span>{tc("total")}</span>
              <span>{formatPrice(total, locale)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
