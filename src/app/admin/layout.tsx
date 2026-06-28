import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-white p-5 md:block">
        <Link href="/admin" className="heading-display text-lg font-semibold">
          Boutique CMS
        </Link>
        <AdminNav />
      </aside>
      <div className="flex-1">
        <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6">
          <span className="text-sm text-muted-foreground">
            {session.user.email}
          </span>
          <Link href="/" className="text-sm text-primary hover:underline">
            View store →
          </Link>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
