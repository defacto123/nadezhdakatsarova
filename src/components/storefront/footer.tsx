"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NewsletterSignup } from "./newsletter-signup";

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border bg-sand">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="heading-display text-2xl">{t("newsletter.title")}</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("newsletter.subtitle")}
          </p>
          <div className="mt-4 max-w-md">
            <NewsletterSignup />
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            {t("footer.shop")}
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/shop" className="hover:text-primary">
                {t("nav.shop")}
              </Link>
            </li>
            <li>
              <Link href="/search" className="hover:text-primary">
                {t("nav.search")}
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-primary">
                {t("nav.account")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            {t("footer.info")}
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/about" className="hover:text-primary">
                {t("footer.about")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-primary">
                {t("footer.contact")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-primary">
                {t("footer.privacy")}
              </Link>
            </li>
          </ul>
          <div className="mt-4 flex gap-4 text-sm">
            <a
              href="https://instagram.com"
              className="text-muted-foreground hover:text-primary"
            >
              Instagram
            </a>
            <a
              href="https://facebook.com"
              className="text-muted-foreground hover:text-primary"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {year} {t("site.name")}. {t("footer.rights")}
          </span>
          <span>
            {t("footer.madeWith")} · {t("common.currencyNote")}
          </span>
        </div>
      </div>
    </footer>
  );
}
