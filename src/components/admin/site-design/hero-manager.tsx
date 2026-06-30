"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { HERO_IMAGE } from "@/lib/site-design";
import {
  saveHeroSlide,
  deleteHeroSlide,
  type HeroSlideInput,
} from "@/lib/admin-actions";

export type HeroSlideData = HeroSlideInput & { id: string };

export function HeroManager({ slides }: { slides: HeroSlideData[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function addSlide() {
    startTransition(async () => {
      await saveHeroSlide({
        eyebrowBg: null,
        eyebrowEn: null,
        headlineBg: null,
        headlineEn: null,
        subtextBg: null,
        subtextEn: null,
        imageUrl: null,
        ctaLabelBg: null,
        ctaLabelEn: null,
        ctaHref: null,
        sortOrder: slides.length,
        active: true,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {slides.length === 0 && (
        <p className="text-sm text-muted-foreground">No slides yet.</p>
      )}
      {slides.map((s) => (
        <SlideCard key={s.id} slide={s} />
      ))}
      <Button onClick={addSlide} disabled={pending}>
        + Add slide
      </Button>
    </div>
  );
}

function SlideCard({ slide }: { slide: HeroSlideData }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [s, setS] = useState<HeroSlideData>(slide);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(
    null,
  );

  function field<K extends keyof HeroSlideData>(key: K, val: HeroSlideData[K]) {
    setS((p) => ({ ...p, [key]: val }));
    setSaved(false);
  }

  async function uploadImage() {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "hero");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        return;
      }
      const next = { ...s, imageUrl: json.url as string };
      setS(next);
      if (typeof json.width === "number" && typeof json.height === "number") {
        setDims({ width: json.width, height: json.height });
      }
      if (fileRef.current) fileRef.current.value = "";
      // Persist immediately so the uploaded image isn't lost if the admin
      // forgets to press "Save slide".
      startTransition(async () => {
        await saveHeroSlide(next);
        setSaved(true);
        router.refresh();
      });
    } catch {
      setError("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    startTransition(async () => {
      await saveHeroSlide(s);
      setSaved(true);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteHeroSlide(s.id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextRow label="Eyebrow (BG)" value={s.eyebrowBg} onChange={(v) => field("eyebrowBg", v)} />
        <TextRow label="Eyebrow (EN)" value={s.eyebrowEn} onChange={(v) => field("eyebrowEn", v)} />
        <TextRow label="Headline (BG)" value={s.headlineBg} onChange={(v) => field("headlineBg", v)} />
        <TextRow label="Headline (EN)" value={s.headlineEn} onChange={(v) => field("headlineEn", v)} />
        <div>
          <Label className="text-xs">Subtext (BG)</Label>
          <Textarea value={s.subtextBg ?? ""} onChange={(e) => field("subtextBg", e.target.value || null)} />
        </div>
        <div>
          <Label className="text-xs">Subtext (EN)</Label>
          <Textarea value={s.subtextEn ?? ""} onChange={(e) => field("subtextEn", e.target.value || null)} />
        </div>
        <TextRow label="CTA label (BG)" value={s.ctaLabelBg} onChange={(v) => field("ctaLabelBg", v)} />
        <TextRow label="CTA label (EN)" value={s.ctaLabelEn} onChange={(v) => field("ctaLabelEn", v)} />
        <TextRow label="CTA link (e.g. /shop)" value={s.ctaHref} onChange={(v) => field("ctaHref", v)} />
        <div>
          <Label className="text-xs">Sort order</Label>
          <Input
            type="number"
            value={s.sortOrder}
            onChange={(e) => field("sortOrder", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {s.imageUrl && (
          <div className="relative h-20 w-32 overflow-hidden rounded-lg border border-border">
            <Image
              src={s.imageUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized={s.imageUrl.startsWith("data:")}
            />
          </div>
        )}
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="block text-sm" />
          <p className="mt-1 text-xs text-muted-foreground">
            Recommended size: {HERO_IMAGE.width}×{HERO_IMAGE.height}px
            (landscape, fills the full banner width).
          </p>
          {dims && (
            <p
              className={
                dims.width === HERO_IMAGE.width &&
                dims.height === HERO_IMAGE.height
                  ? "mt-1 text-xs text-sage-dark"
                  : "mt-1 text-xs text-amber-600"
              }
            >
              Uploaded: {dims.width}×{dims.height}px
              {(dims.width !== HERO_IMAGE.width ||
                dims.height !== HERO_IMAGE.height) &&
                ` — differs from the recommended ${HERO_IMAGE.width}×${HERO_IMAGE.height}px; it will still be used but may be cropped.`}
            </p>
          )}
          <Button variant="outline" className="mt-2" onClick={uploadImage} disabled={busy}>
            {busy ? "Uploading..." : "Upload image"}
          </Button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={s.active}
            onChange={(e) => field("active", e.target.checked)}
          />
          Active
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button onClick={save} disabled={pending}>
          Save slide
        </Button>
        <Button variant="ghost" onClick={remove} disabled={pending}>
          Delete
        </Button>
        {saved && <span className="text-sm text-sage-dark">Saved</span>}
      </div>
    </div>
  );
}

function TextRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} />
    </div>
  );
}
