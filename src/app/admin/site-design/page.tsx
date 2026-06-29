import Link from "next/link";
import {
  Paintbrush,
  Type,
  Image as ImageIcon,
  FileText,
  GalleryHorizontalEnd,
  Share2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const modules = [
  {
    href: "/admin/site-design/theme",
    title: "Theme & colours",
    desc: "Pick your palette and corner radius with colour pickers.",
    icon: Paintbrush,
  },
  {
    href: "/admin/site-design/fonts",
    title: "Fonts",
    desc: "Upload custom fonts and assign body/heading typefaces.",
    icon: Type,
  },
  {
    href: "/admin/site-design/images",
    title: "Images",
    desc: "Replace site photos with exact-dimension uploads.",
    icon: ImageIcon,
  },
  {
    href: "/admin/site-design/content",
    title: "Content",
    desc: "Edit all static, bilingual marketing copy.",
    icon: FileText,
  },
  {
    href: "/admin/site-design/hero",
    title: "Hero slides",
    desc: "Manage the homepage banner slides.",
    icon: GalleryHorizontalEnd,
  },
  {
    href: "/admin/site-design/social",
    title: "Social links",
    desc: "Manage footer social media links.",
    icon: Share2,
  },
];

export default function SiteDesignPage() {
  return (
    <div>
      <h1 className="heading-display text-3xl">Site Design</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Control the look and feel of your storefront — colours, fonts, images
        and all editable content — without touching code.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-2xl border border-border bg-white p-5 transition-colors hover:border-primary"
            >
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-lg font-semibold">{m.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
