"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useLocale, useTranslations } from "next-intl";
import { getStripeClient } from "@/lib/stripe-client";
import { Button } from "@/components/ui/button";

function PayForm({ siteUrl }: { siteUrl: string }) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${siteUrl}/${locale}/checkout/success`,
      },
    });
    if (error) {
      setError(error.message ?? "Payment failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || loading}
      >
        {loading ? t("placingOrder") : t("payNow")}
      </Button>
    </form>
  );
}

export function PaymentStep({
  clientSecret,
  siteUrl,
}: {
  clientSecret: string;
  siteUrl: string;
}) {
  return (
    <Elements
      stripe={getStripeClient()}
      options={{
        clientSecret,
        appearance: {
          theme: "flat",
          variables: { colorPrimary: "#c4633f", borderRadius: "12px" },
        },
      }}
    >
      <PayForm siteUrl={siteUrl} />
    </Elements>
  );
}
