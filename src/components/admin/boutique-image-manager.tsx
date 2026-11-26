"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import {
  HERO_MOTIONS,
  HERO_SPEED,
  heroMotionDuration,
} from "@/lib/site-design";
import {
  saveBoutiqueImage,
  deleteBoutiqueImage,
  moveBoutiqueImage,
  type BoutiqueImageInput,
} from "@/lib/admin-actions";
import { isRawImage } from "@/lib/utils";

export type BoutiqueImageData = BoutiqueImageInput & { id: string };

/** Recommended (not enforced) size, same as the classic homepage decorations. */
const RECOMMENDED = { width: 700, height: 900 };

const POSITIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
] as const;

export function BoutiqueImageManager({
  images,
  productCount,
}: {
  images: BoutiqueImageData[];
  productCount: number;
}) {
  const [adding, setAdding] = useState(false);
  const active = images.filter((i) => i.active).length;

  return (
    <section className="mt-12">
      <h2 className="heading-display text-2xl">Boutique images</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Decorative images placed between the boutique products. They are spread
        evenly through the feed (e.g. 9 products and 2 images → after the 3rd
        and the 6th product) in the order below. Spacing updates automatically
        when you add products or images. Currently{" "}
        <strong>{active}</strong> visible image{active === 1 ? "" : "s"},{" "}
        <strong>{productCount}</strong> product{productCount === 1 ? "" : "s"}.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {images.map((img, i) => (
          <ImageCard
            key={img.id}
            initial={img}
            isFirst={i === 0}
            isLast={i === images.length - 1}
          />
        ))}
        {adding && <ImageCard onDone={() => setAdding(false)} />}
      </div>

      {!adding && (
        <Button className="mt-5" onClick={() => setAdding(true)}>
          + Add image
        </Button>
      )}
    </section>
  );
}

function ImageCard({
  initial,
  isFirst,
  isLast,
  onDone,
}: {
  initial?: BoutiqueImageData;
  isFirst?: boolean;
  isLast?: boolean;
  /** New-card only: called after the first save or on cancel. */
  onDone?: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initial?.url ?? "");
  const [altBg, setAltBg] = useState(initial?.altBg ?? "");
  const [altEn, setAltEn] = useState(initial?.altEn ?? "");
  const [animated, setAnimated] = useState(initial?.animated ?? true);
  const [motion, setMotion] = useState(initial?.motion ?? "float");
  const [speed, setSpeed] = useState(initial?.speed ?? HERO_SPEED.default);
  const [bgColor, setBgColor] = useState<string | null>(initial?.bgColor ?? null);
  const [position, setPosition] = useState<BoutiqueImageInput["position"]>(
    initial?.position ?? "center",
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  async function upload() {
    setError(null);
    setNotice(null);
    setOk(false);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "site");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        return;
      }
      setUrl(json.url);
      if (
        json.width &&
        json.height &&
        (json.width !== RECOMMENDED.width || json.height !== RECOMMENDED.height)
      ) {
        setNotice(
          `Uploaded ${json.width}×${json.height}px (recommended ${RECOMMENDED.width}×${RECOMMENDED.height}px) — it will still be shown, scaled to fit.`,
        );
      }
    } catch {
      setError("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!url) {
      setError("Upload an image before saving.");
      return;
    }
    startTransition(async () => {
      await saveBoutiqueImage({
        id: initial?.id,
        url,
        altBg: altBg || null,
        altEn: altEn || null,
        animated,
        motion,
        speed,
        bgColor,
        position,
        active,
      });
      setOk(true);
      onDone?.();
      router.refresh();
    });
  }

  function remove() {
    if (!initial) {
      onDone?.();
      return;
    }
    if (!confirm("Delete this image from the boutique?")) return;
    startTransition(async () => {
      await deleteBoutiqueImage(initial.id);
      router.refresh();
    });
  }

  function move(direction: "up" | "down") {
    if (!initial) return;
    startTransition(async () => {
      await moveBoutiqueImage(initial.id, direction);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            {initial ? "Image" : "New image"}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Transparent PNG recommended.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-1 shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {RECOMMENDED.width}×{RECOMMENDED.height}px
          </span>
          {initial && (
            <>
              <button
                type="button"
                aria-label="Move up"
                title="Move up"
                disabled={pending || isFirst}
                onClick={() => move("up")}
                className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                title="Move down"
                disabled={pending || isLast}
                onClick={() => move("down")}
                className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="mt-4 overflow-hidden rounded-xl border border-border"
        style={{ backgroundColor: bgColor ?? "var(--color-muted)" }}
      >
        {url ? (
          <div className="relative aspect-video">
            <Image
              src={url}
              alt={altEn || "Boutique image"}
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-contain"
              unoptimized={isRawImage(url)}
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
            No image yet
          </div>
        )}
      </div>

      <div className="mt-3">
        <input ref={fileRef} type="file" accept="image/*" className="block text-sm" />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Alt text (BG)</Label>
          <Input value={altBg} onChange={(e) => setAltBg(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Alt text (EN)</Label>
          <Input value={altEn} onChange={(e) => setAltEn(e.target.value)} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Position in the row</Label>
          <Select
            value={position}
            onChange={(e) =>
              setPosition(e.target.value as BoutiqueImageInput["position"])
            }
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Visible on the site
        </label>
      </div>

      <div className="mt-3 rounded-xl border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={animated}
            onChange={(e) => setAnimated(e.target.checked)}
          />
          Animated
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Motion</Label>
            <Select
              value={motion}
              disabled={!animated}
              onChange={(e) => setMotion(e.target.value)}
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
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="mt-2 w-full cursor-pointer accent-[#b76e5b] disabled:opacity-40"
            />
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-xs">Background</Label>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="color"
              value={bgColor ?? "#f4efe9"}
              disabled={bgColor === null}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-border bg-white p-0.5 disabled:opacity-40"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={bgColor === null}
                onChange={(e) => setBgColor(e.target.checked ? null : "#f4efe9")}
              />
              No background (transparent)
            </label>
          </div>
        </div>
      </div>

      {notice && <p className="mt-2 text-xs text-muted-foreground">{notice}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <Button variant="outline" onClick={upload} disabled={busy}>
          {busy ? "Uploading..." : "Upload"}
        </Button>
        <Button onClick={save} disabled={pending}>
          Save
        </Button>
        <Button variant="ghost" onClick={remove} disabled={pending}>
          {initial ? "Delete" : "Cancel"}
        </Button>
        {ok && <span className="text-sm text-sage-dark">Saved</span>}
      </div>
    </div>
  );
}
