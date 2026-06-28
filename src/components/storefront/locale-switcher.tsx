"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const current = (params.locale as string) ?? routing.defaultLocale;

  return (
    <div className={cn("flex items-center gap-1 text-sm", className)}>
      {routing.locales.map((loc, i) => (
        <span key={loc} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground">/</span>}
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: loc })}
            className={cn(
              "uppercase transition-colors hover:text-primary",
              current === loc
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
          >
            {loc}
          </button>
        </span>
      ))}
    </div>
  );
}
