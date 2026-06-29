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
    <div className="mb-9 flex flex-col items-center text-center">
      <h2 className="heading-display text-3xl sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
      )}
      {href && linkLabel && (
        <Link
          href={href}
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
