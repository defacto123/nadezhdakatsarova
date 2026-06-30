"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, Plus, Upload } from "lucide-react";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveProduct, deleteProduct } from "@/lib/admin-actions";
import { PRODUCT_IMAGE } from "@/lib/site-design";
import { slugify } from "@/lib/utils";

interface CategoryOpt {
  id: string;
  nameEn: string;
}

interface VariantRow {
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceOverrideEuros: string;
}

interface ImageRow {
  url: string;
  alt: string;
}

export interface ProductFormData {
  id?: string;
  slug: string;
  titleBg: string;
  titleEn: string;
  descriptionBg: string;
  descriptionEn: string;
  priceEuros: string;
  salePercent: string;
  featured: boolean;
  isNew: boolean;
  active: boolean;
  categoryId: string;
  images: ImageRow[];
  variants: VariantRow[];
}

export function ProductForm({
  categories,
  initial,
}: {
  categories: CategoryOpt[];
  initial?: ProductFormData;
}) {
  const router = useRouter();
  const [data, setData] = useState<ProductFormData>(
    initial ?? {
      slug: "",
      titleBg: "",
      titleEn: "",
      descriptionBg: "",
      descriptionEn: "",
      priceEuros: "",
      salePercent: "",
      featured: false,
      isNew: true,
      active: true,
      categoryId: categories[0]?.id ?? "",
      images: [],
      variants: [],
    },
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (json.url) {
          setData((d) => ({
            ...d,
            images: [...d.images, { url: json.url, alt: d.titleEn }],
          }));
        }
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function addVariant() {
    set("variants", [
      ...data.variants,
      { size: "", color: "", sku: "", stock: 0, priceOverrideEuros: "" },
    ]);
  }

  function updateVariant(i: number, patch: Partial<VariantRow>) {
    set(
      "variants",
      data.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveProduct({
        id: data.id,
        slug: data.slug || slugify(data.titleEn || data.titleBg),
        titleBg: data.titleBg,
        titleEn: data.titleEn,
        descriptionBg: data.descriptionBg || null,
        descriptionEn: data.descriptionEn || null,
        priceCents: Math.round(parseFloat(data.priceEuros || "0") * 100),
        salePercent: data.salePercent ? parseInt(data.salePercent, 10) : null,
        featured: data.featured,
        isNew: data.isNew,
        active: data.active,
        categoryId: data.categoryId,
        images: data.images.map((img) => ({ url: img.url, alt: img.alt || null })),
        variants: data.variants.map((v) => ({
          size: v.size || null,
          color: v.color || null,
          sku: v.sku || null,
          stock: Number(v.stock) || 0,
          priceOverrideCents: v.priceOverrideEuros
            ? Math.round(parseFloat(v.priceOverrideEuros) * 100)
            : null,
        })),
      });
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this product?")) return;
    await deleteProduct(data.id);
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Title (BG)</Label>
          <Input
            required
            value={data.titleBg}
            onChange={(e) => set("titleBg", e.target.value)}
          />
        </div>
        <div>
          <Label>Title (EN)</Label>
          <Input
            required
            value={data.titleEn}
            onChange={(e) => {
              set("titleEn", e.target.value);
              if (!data.id && !data.slug) set("slug", slugify(e.target.value));
            }}
          />
        </div>
      </div>

      <div>
        <Label>Slug</Label>
        <Input value={data.slug} onChange={(e) => set("slug", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Description (BG)</Label>
          <Textarea
            value={data.descriptionBg}
            onChange={(e) => set("descriptionBg", e.target.value)}
          />
        </div>
        <div>
          <Label>Description (EN)</Label>
          <Textarea
            value={data.descriptionEn}
            onChange={(e) => set("descriptionEn", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Price (EUR)</Label>
          <Input
            type="number"
            step="0.01"
            required
            value={data.priceEuros}
            onChange={(e) => set("priceEuros", e.target.value)}
          />
        </div>
        <div>
          <Label>Sale %</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={data.salePercent}
            onChange={(e) => set("salePercent", e.target.value)}
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select
            value={data.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.featured}
            onChange={(e) => set("featured", e.target.checked)}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.isNew}
            onChange={(e) => set("isNew", e.target.checked)}
          />
          New
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          Active (visible)
        </label>
      </div>

      {/* Images */}
      <div>
        <Label>Images</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Recommended: square images, {PRODUCT_IMAGE.width}×{PRODUCT_IMAGE.height}px
          (1:1). Product photos are shown in square frames, so square images
          avoid cropping.
        </p>
        <div className="flex flex-wrap gap-3">
          {data.images.map((img, i) => (
            <div key={i} className="relative h-24 w-24 overflow-hidden rounded-xl border border-border">
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized={img.url.startsWith("data:")}
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    "images",
                    data.images.filter((_, idx) => idx !== i),
                  )
                }
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </button>
            </div>
          ))}
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary">
            <Upload className="mb-1 h-4 w-4" />
            {uploading ? "..." : "Upload"}
            <input type="file" accept="image/*" multiple hidden onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Variants */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Variants & stock</Label>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="h-4 w-4" /> Add variant
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Leave empty for a simple product. Stock here controls in/out-of-stock on the store.
        </p>
        <div className="space-y-2">
          {data.variants.map((v, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-3">
                <span className="text-xs text-muted-foreground">Size</span>
                <Input
                  value={v.size}
                  onChange={(e) => updateVariant(i, { size: e.target.value })}
                />
              </div>
              <div className="col-span-3">
                <span className="text-xs text-muted-foreground">Color</span>
                <Input
                  value={v.color}
                  onChange={(e) => updateVariant(i, { color: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">Stock</span>
                <Input
                  type="number"
                  value={v.stock}
                  onChange={(e) =>
                    updateVariant(i, { stock: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>
              <div className="col-span-3">
                <span className="text-xs text-muted-foreground">Price override (EUR)</span>
                <Input
                  type="number"
                  step="0.01"
                  value={v.priceOverrideEuros}
                  onChange={(e) =>
                    updateVariant(i, { priceOverrideEuros: e.target.value })
                  }
                />
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "variants",
                      data.variants.filter((_, idx) => idx !== i),
                    )
                  }
                  className="flex h-11 w-full items-center justify-center text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving..." : "Save product"}
        </Button>
        {data.id && (
          <Button type="button" variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
