"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SITE_IMAGE_SLOTS, type ImageSlot } from "@/lib/site-design";
import { saveSiteImage, deleteSiteImage } from "@/lib/admin-actions";

type ImageRow = { url: string; altBg: string | null; altEn: string | null };

export function ImageSlotManager({
  images,
}: {
  images: Record<string, ImageRow>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {SITE_IMAGE_SLOTS.map((slot) => (
        <SlotCard key={slot.slot} slot={slot} current={images[slot.slot]} />
      ))}
    </div>
  );
}

function SlotCard({
  slot,
  current,
}: {
  slot: ImageSlot;
  current?: ImageRow;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(current?.url ?? "");
  const [dims, setDims] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [altBg, setAltBg] = useState(current?.altBg ?? "");
  const [altEn, setAltEn] = useState(current?.altEn ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  async function upload() {
    setError(null);
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
      fd.append("slot", slot.slot);
      fd.append("folder", "site");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        return;
      }
      setUrl(json.url);
      setDims({ width: json.width, height: json.height });
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
      await saveSiteImage({
        slot: slot.slot,
        url,
        altBg: altBg || null,
        altEn: altEn || null,
        width: dims?.width ?? slot.width,
        height: dims?.height ?? slot.height,
      });
      setOk(true);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteSiteImage(slot.slot);
      setUrl("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{slot.label}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {slot.description}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {slot.width}×{slot.height}px
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted">
        {url ? (
          <div className="relative aspect-video">
            <Image
              src={url}
              alt={altEn || slot.label}
              fill
              className="object-contain"
              unoptimized={url.startsWith("data:")}
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
            No image set
          </div>
        )}
      </div>

      <div className="mt-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="block text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Must be exactly {slot.width}×{slot.height}px.
        </p>
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

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <Button variant="outline" onClick={upload} disabled={busy}>
          {busy ? "Uploading..." : "Upload"}
        </Button>
        <Button onClick={save} disabled={pending}>
          Save
        </Button>
        {current && (
          <Button variant="ghost" onClick={remove} disabled={pending}>
            Remove
          </Button>
        )}
        {ok && <span className="text-sm text-sage-dark">Saved</span>}
      </div>
    </div>
  );
}
