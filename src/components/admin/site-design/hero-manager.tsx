"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import {
  HERO_IMAGE,
  HERO_PAIR_IMAGE,
  HERO_MOTIONS,
  HERO_SPEED,
  heroMotionDuration,
} from "@/lib/site-design";
import {
  saveHeroSlide,
  deleteHeroSlide,
  type HeroSlideInput,
} from "@/lib/admin-actions";

export type HeroSlideData = HeroSlideInput & { id: string };

type Dims = { width: number; height: number };

export function HeroManager({ slides }: { slides: HeroSlideData[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function addSlide() {
    startTransition(async () => {
      await saveHeroSlide({
        kind: "single",
        imageUrl: null,
        imageUrl2: null,
        href: null,
        motion1: "float",
        speed1: HERO_SPEED.default,
        animated1: true,
        motion2: "float",
        speed2: HERO_SPEED.default,
        animated2: true,
        bgColor: "#f4efe9",
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
  const [s, setS] = useState<HeroSlideData>(slide);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function field<K extends keyof HeroSlideData>(key: K, val: HeroSlideData[K]) {
    setS((p) => ({ ...p, [key]: val }));
    setSaved(false);
  }

  // Persist immediately (used after an upload so the image isn't lost if the
  // admin forgets to press "Save slide").
  function persist(next: HeroSlideData) {
    setS(next);
    startTransition(async () => {
      await saveHeroSlide(next);
      setSaved(true);
      router.refresh();
    });
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

  const isPair = s.kind === "pair";

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={s.kind} onChange={(e) => field("kind", e.target.value)}>
            <option value="single">Single big image (fade in)</option>
            <option value="pair">Two images (slide in from the edges)</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Redirect URL (e.g. /shop or https://…)</Label>
          <Input
            value={s.href ?? ""}
            onChange={(e) => field("href", e.target.value || null)}
            placeholder="/shop"
          />
        </div>
        <div>
          <Label className="text-xs">Background</Label>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="color"
              value={s.bgColor ?? "#f4efe9"}
              disabled={s.bgColor === null}
              onChange={(e) => field("bgColor", e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-border bg-white p-0.5 disabled:opacity-40"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.bgColor === null}
                onChange={(e) =>
                  field("bgColor", e.target.checked ? null : "#f4efe9")
                }
              />
              No background (transparent)
            </label>
          </div>
        </div>
        <div>
          <Label className="text-xs">Sort order</Label>
          <Input
            type="number"
            value={s.sortOrder}
            onChange={(e) => field("sortOrder", Number(e.target.value))}
          />
        </div>
        <div className="flex items-end gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.active}
              onChange={(e) => field("active", e.target.checked)}
            />
            Active
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SlideImage
          label={isPair ? "Left-edge image" : "Image"}
          url={s.imageUrl}
          recommended={isPair ? HERO_PAIR_IMAGE : HERO_IMAGE}
          onUploaded={(url) => persist({ ...s, imageUrl: url })}
          animated={s.animated1}
          motion={s.motion1}
          speed={s.speed1}
          onAnimatedChange={(v) => field("animated1", v)}
          onMotionChange={(v) => field("motion1", v)}
          onSpeedChange={(v) => field("speed1", v)}
        />
        {isPair && (
          <SlideImage
            label="Right-edge image"
            url={s.imageUrl2}
            recommended={HERO_PAIR_IMAGE}
            onUploaded={(url) => persist({ ...s, imageUrl2: url })}
            animated={s.animated2}
            motion={s.motion2}
            speed={s.speed2}
            onAnimatedChange={(v) => field("animated2", v)}
            onMotionChange={(v) => field("motion2", v)}
            onSpeedChange={(v) => field("speed2", v)}
          />
        )}
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

function SlideImage({
  label,
  url,
  recommended,
  onUploaded,
  animated,
  motion,
  speed,
  onAnimatedChange,
  onMotionChange,
  onSpeedChange,
}: {
  label: string;
  url: string | null;
  recommended: Dims;
  onUploaded: (url: string) => void;
  animated: boolean;
  motion: string;
  speed: number;
  onAnimatedChange: (value: boolean) => void;
  onMotionChange: (value: string) => void;
  onSpeedChange: (value: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dims, setDims] = useState<Dims | null>(null);

  async function upload() {
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
      if (typeof json.width === "number" && typeof json.height === "number") {
        setDims({ width: json.width, height: json.height });
      }
      if (fileRef.current) fileRef.current.value = "";
      onUploaded(json.url as string);
    } catch {
      setError("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const matches =
    dims && dims.width === recommended.width && dims.height === recommended.height;

  return (
    <div className="rounded-xl border border-border p-3">
      <Label className="mb-2 text-xs">{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {url && (
          <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
            <Image
              src={url}
              alt=""
              fill
              sizes="80px"
              className="object-contain"
              unoptimized={url.startsWith("data:")}
            />
          </div>
        )}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/*"
            className="block text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Recommended: {recommended.width}×{recommended.height}px. Transparent
            PNG recommended.
          </p>
          {dims && (
            <p
              className={
                matches ? "mt-1 text-xs text-sage-dark" : "mt-1 text-xs text-amber-600"
              }
            >
              Uploaded: {dims.width}×{dims.height}px
              {!matches &&
                ` — differs from the recommended ${recommended.width}×${recommended.height}px; it will still be used.`}
            </p>
          )}
          <Button
            variant="outline"
            className="mt-2"
            onClick={upload}
            disabled={busy}
          >
            {busy ? "Uploading..." : "Upload"}
          </Button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={animated}
            onChange={(e) => onAnimatedChange(e.target.checked)}
          />
          Animated
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Motion</Label>
            <Select
              value={motion}
              disabled={!animated}
              onChange={(e) => onMotionChange(e.target.value)}
            >
              {HERO_MOTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label className="text-xs">
              Speed: {speed} ({heroMotionDuration(speed)}s per loop)
            </Label>
            <input
              type="range"
              min={HERO_SPEED.min}
              max={HERO_SPEED.max}
              value={speed}
              disabled={!animated}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="mt-2 w-full cursor-pointer accent-[#b76e5b] disabled:opacity-40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
