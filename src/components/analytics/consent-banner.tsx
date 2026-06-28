"use client";

import { useReducer } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useIsHydrated, useCookieConsent } from "@/lib/hooks";

export function ConsentBanner() {
  const t = useTranslations("consent");
  const hydrated = useIsHydrated();
  const consent = useCookieConsent();
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  function decide(value: "accepted" | "declined") {
    localStorage.setItem("cookie-consent", value);
    window.dispatchEvent(new Event("cookie-consent-change"));
    forceUpdate();
  }

  if (!hydrated || consent) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="container-page flex flex-col items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-2xl sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">{t("message")}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => decide("declined")}>
            {t("decline")}
          </Button>
          <Button size="sm" onClick={() => decide("accepted")}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
