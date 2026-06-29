import NextImage from "next/image";
import { setRequestLocale } from "next-intl/server";
import { getContentMap, getSiteImages } from "@/lib/site-settings";
import { contentValue } from "@/lib/site-design";
import { pick } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [content, images] = await Promise.all([
    getContentMap(),
    getSiteImages(),
  ]);
  const c = (key: string) => contentValue(content, key, locale);
  const portrait = images["about-portrait"];

  const sections = [
    { title: c("about.section1Title"), body: c("about.section1Body") },
    { title: c("about.section2Title"), body: c("about.section2Body") },
  ].filter((s) => s.title || s.body);

  return (
    <div className="container-page py-16">
      <div className="grid items-start gap-10 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <h1 className="heading-display text-4xl sm:text-5xl">
            {c("about.title")}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {c("about.intro")}
          </p>
        </div>
        <div className="order-1 md:order-2">
          {portrait ? (
            <div className="relative aspect-[5/6] overflow-hidden rounded-3xl bg-sand">
              <NextImage
                src={portrait.url}
                alt={pick(locale, portrait.altBg, portrait.altEn) || c("about.title")}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                unoptimized={portrait.url.startsWith("data:")}
              />
            </div>
          ) : (
            <div className="aspect-[5/6] rounded-3xl bg-gradient-to-br from-blush via-sand to-cream" />
          )}
        </div>
      </div>

      {sections.length > 0 && (
        <div className="mx-auto mt-16 grid max-w-4xl gap-12 sm:grid-cols-2">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="heading-display text-2xl">{s.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
