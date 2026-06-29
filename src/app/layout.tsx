import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { getLocale } from "next-intl/server";
import { getResolvedTheme, buildThemeCss } from "@/lib/site-settings";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Nadezhda Katsarova — Art Boutique",
    template: "%s — Nadezhda Katsarova",
  },
  description:
    "Hand-drawn art on t-shirts, mugs, totes and more. Independent illustrations, made with love.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const theme = await getResolvedTheme();
  const themeCss = buildThemeCss(theme);
  return (
    <html
      lang={locale}
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        {/* Runtime theme: colours + uploaded fonts from the Site Design CMS.
            Placed after the imported stylesheet so :root overrides win. */}
        <style
          id="site-theme"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
