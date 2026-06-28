"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveCategory, deleteCategory } from "@/lib/admin-actions";
import { slugify } from "@/lib/utils";

export interface CategoryRow {
  id: string;
  slug: string;
  nameBg: string;
  nameEn: string;
  descriptionBg: string | null;
  descriptionEn: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  active: boolean;
  productCount: number;
}

const empty = {
  slug: "",
  nameBg: "",
  nameEn: "",
  descriptionBg: "",
  descriptionEn: "",
  image: "",
  parentId: "",
  sortOrder: 0,
  active: true,
};

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<typeof empty & { id?: string }>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function edit(c: CategoryRow) {
    setEditing({
      id: c.id,
      slug: c.slug,
      nameBg: c.nameBg,
      nameEn: c.nameEn,
      descriptionBg: c.descriptionBg ?? "",
      descriptionEn: c.descriptionEn ?? "",
      image: c.image ?? "",
      parentId: c.parentId ?? "",
      sortOrder: c.sortOrder,
      active: c.active,
    });
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (json.url) setEditing((s) => ({ ...s, image: json.url }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveCategory({
        id: editing.id,
        slug: editing.slug || slugify(editing.nameEn || editing.nameBg),
        nameBg: editing.nameBg,
        nameEn: editing.nameEn,
        descriptionBg: editing.descriptionBg || null,
        descriptionEn: editing.descriptionEn || null,
        image: editing.image || null,
        parentId: editing.parentId || null,
        sortOrder: Number(editing.sortOrder) || 0,
        active: editing.active,
      });
      setEditing(empty);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete category?")) return;
    try {
      await deleteCategory(id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <button onClick={() => edit(c)} className="font-medium hover:text-primary">
                    {c.nameEn} / {c.nameBg}
                  </button>
                  <div className="text-xs text-muted-foreground">{c.slug}</div>
                </td>
                <td className="px-4 py-3">{c.productCount}</td>
                <td className="px-4 py-3">
                  <Badge variant={c.active ? "success" : "neutral"}>
                    {c.active ? "Active" : "Hidden"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(c.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={submit}
        className="h-fit space-y-3 rounded-2xl border border-border bg-white p-5"
      >
        <h2 className="font-semibold">{editing.id ? "Edit" : "New"} category</h2>
        <div>
          <Label>Name (BG)</Label>
          <Input
            required
            value={editing.nameBg}
            onChange={(e) => setEditing((s) => ({ ...s, nameBg: e.target.value }))}
          />
        </div>
        <div>
          <Label>Name (EN)</Label>
          <Input
            required
            value={editing.nameEn}
            onChange={(e) => setEditing((s) => ({ ...s, nameEn: e.target.value }))}
          />
        </div>
        <div>
          <Label>Parent (optional)</Label>
          <Select
            value={editing.parentId}
            onChange={(e) => setEditing((s) => ({ ...s, parentId: e.target.value }))}
          >
            <option value="">— None (top level) —</option>
            {categories
              .filter((c) => c.id !== editing.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
          </Select>
        </div>
        <div>
          <Label>Description (EN)</Label>
          <Textarea
            value={editing.descriptionEn}
            onChange={(e) =>
              setEditing((s) => ({ ...s, descriptionEn: e.target.value }))
            }
          />
        </div>
        <div>
          <Label>Image</Label>
          {editing.image && (
            <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-lg">
              <Image
                src={editing.image}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized={editing.image.startsWith("data:")}
              />
            </div>
          )}
          <input type="file" accept="image/*" onChange={upload} className="text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={editing.active}
            onChange={(e) => setEditing((s) => ({ ...s, active: e.target.checked }))}
          />
          Active
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "..." : "Save"}
          </Button>
          {editing.id && (
            <Button type="button" variant="ghost" onClick={() => setEditing(empty)}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
