"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Returns false during SSR and the first client render, then true once
 * hydrated. Avoids setState-in-effect for hydration guards.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function subscribeConsent(callback: () => void) {
  window.addEventListener("cookie-consent-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("cookie-consent-change", callback);
    window.removeEventListener("storage", callback);
  };
}

/** Subscribe to the analytics cookie-consent value (client only). */
export function useCookieConsent(): "accepted" | "declined" | null {
  return useSyncExternalStore(
    subscribeConsent,
    () =>
      (localStorage.getItem("cookie-consent") as
        | "accepted"
        | "declined"
        | null) ?? null,
    () => null,
  );
}
