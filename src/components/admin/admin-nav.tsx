"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  ShoppingCart,
  Truck,
  Users,
  Mail,
  Palette,
  Paintbrush,
  Type,
  Image as ImageIcon,
  FileText,
  GalleryHorizontalEnd,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string; icon: LucideIcon }[];
};

const links: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/subscribers", label: "Subscribers", icon: Users },
  { href: "/admin/campaigns", label: "Campaigns", icon: Mail },
  {
    href: "/admin/site-design",
    label: "Site Design",
    icon: Palette,
    children: [
      { href: "/admin/site-design/theme", label: "Theme & colours", icon: Paintbrush },
      { href: "/admin/site-design/fonts", label: "Fonts", icon: Type },
      { href: "/admin/site-design/images", label: "Images", icon: ImageIcon },
      { href: "/admin/site-design/content", label: "Content", icon: FileText },
      { href: "/admin/site-design/hero", label: "Hero slides", icon: GalleryHorizontalEnd },
      { href: "/admin/site-design/social", label: "Social links", icon: Share2 },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="mt-6 flex flex-col gap-1">
      {links.map((l) => {
        const Icon = l.icon;
        if (l.children) {
          const groupActive = pathname.startsWith(l.href);
          return (
            <div key={l.href} className="mt-2">
              <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Icon className="h-4 w-4" />
                {l.label}
              </div>
              <div className="ml-2 flex flex-col gap-1 border-l border-border pl-2">
                {l.children.map((c) => {
                  const CIcon = c.icon;
                  const active = pathname.startsWith(c.href);
                  return (
                    <Link
                      key={c.href}
                      href={c.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <CIcon className="h-4 w-4" />
                      {c.label}
                    </Link>
                  );
                })}
              </div>
              {/* keep group highlighted on the index page */}
              {groupActive && pathname === l.href && (
                <span className="sr-only">active</span>
              )}
            </div>
          );
        }
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
