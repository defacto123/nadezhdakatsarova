"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";
import { trackEvent } from "@/components/analytics/ga";

export function ClearCart({
  value,
  orderNumber,
}: {
  value?: number;
  orderNumber?: number;
}) {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
    if (value != null) {
      trackEvent("purchase", {
        currency: "EUR",
        value,
        transaction_id: orderNumber ? String(orderNumber) : undefined,
      });
    }
  }, [clear, value, orderNumber]);
  return null;
}
