import { Link } from "@/i18n/navigation";

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <h2 className="heading-display text-2xl sm:text-3xl">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
