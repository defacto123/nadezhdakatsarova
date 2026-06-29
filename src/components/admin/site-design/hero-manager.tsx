"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
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

  function field<K extends keyof HeroSlideData>(key: K, val: HeroSlideData[K]) {
    setS((p) => ({ ...p, [key]: val }));
    setSaved(false);
  }

  async function uploadImage() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "hero");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) field("imageUrl", json.url);
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
          <Button variant="outline" className="mt-2" onClick={uploadImage} disabled={busy}>
            {busy ? "Uploading..." : "Upload image"}
          </Button>
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
