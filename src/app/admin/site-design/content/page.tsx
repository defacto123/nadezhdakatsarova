import { getContentMap } from "@/lib/site-settings";
import { ContentEditor } from "@/components/admin/site-design/content-editor";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const initial = await getContentMap();
  return (
    <div>
      <h1 className="heading-display text-3xl">Content</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Edit the static, marketing copy across the site in both Bulgarian and
        English. Empty fields fall back to the built-in defaults.
      </p>
      <div className="mt-8">
        <ContentEditor initial={initial} />
      </div>
    </div>
  );
}
