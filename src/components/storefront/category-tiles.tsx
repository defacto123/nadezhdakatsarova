import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/content";

type Cat = {
  slug: string;
  nameBg: string;
  nameEn: string;
  image: string | null;
};

export function CategoryTiles({
  categories,
  locale,
}: {
  categories: Cat[];
  locale: string;
}) {
  if (categories.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {categories.slice(0, 8).map((c) => (
        <Link
          key={c.slug}
          href={`/category/${c.slug}`}
          className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl bg-sand"
        >
          {c.image && (
            <Image
              src={c.image}
              alt={pick(locale, c.nameBg, c.nameEn)}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={c.image.startsWith("data:")}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
          <span className="relative m-4 text-lg font-semibold text-white">
            {pick(locale, c.nameBg, c.nameEn)}
          </span>
        </Link>
      ))}
    </div>
  );
}
