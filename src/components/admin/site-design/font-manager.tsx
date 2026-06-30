"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import {
  saveFontAsset,
  deleteFontAsset,
  setActiveFont,
} from "@/lib/admin-actions";

type Font = {
  id: string;
  label: string;
  family: string;
  url: string;
  format: string;
};

const SRC_FORMAT: Record<string, string> = {
  woff2: "woff2",
  woff: "woff",
  ttf: "truetype",
  otf: "opentype",
};

const DEFAULT_SAMPLE = "The quick brown fox · Бърза кафява лисица 1234";
const PREVIEW_FAMILY = "__font_upload_preview__";

export function FontManager({
  fonts,
  bodyFontId,
  headingFontId,
}: {
  fonts: Font[];
  bodyFontId: string | null;
  headingFontId: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [family, setFamily] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [sample, setSample] = useState(DEFAULT_SAMPLE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewReady, setPreviewReady] = useState(false);

  // Load the just-selected (not yet uploaded) font into the browser so the
  // admin can preview it before saving.
  useEffect(() => {
    if (!previewUrl) return;
    const face = new FontFace(PREVIEW_FAMILY, `url(${previewUrl})`);
    let cancelled = false;
    face
      .load()
      .then((loaded) => {
        if (cancelled) return;
        document.fonts.add(loaded);
        setPreviewReady(true);
      })
      .catch(() => {
        if (!cancelled) setPreviewReady(false);
      });
    return () => {
      cancelled = true;
      try {
        document.fonts.delete(face);
      } catch {
        // ignore
      }
    };
  }, [previewUrl]);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? null);
    setPreviewReady(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    if (file) {
      // Pre-fill label/family from the file name so the admin isn't blocked by
      // the secondary "enter a label" validation; both stay editable.
      const base = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      setLabel((prev) => prev || base);
      setFamily((prev) => prev || base);
    }
  }

  // @font-face declarations so previews render in the actual uploaded fonts.
  // Served via the same-origin /api/fonts proxy to avoid cross-origin font
  // (CORS) blocking when the file lives on GCS.
  const faceCss = fonts
    .map(
      (f) =>
        `@font-face{font-family:'${f.family.replace(/['"\\]/g, "")}';src:url('/api/fonts/${f.id}') format('${SRC_FORMAT[f.format] ?? f.format}');font-display:swap;}`,
    )
    .join("\n");

  async function upload() {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a font file first.");
      return;
    }
    if (!label || !family) {
      setError("Enter a label and a font family name.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-font", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        return;
      }
      await saveFontAsset({ label, family, url: json.url, format: json.ext });
      setLabel("");
      setFamily("");
      setFileName(null);
      setPreviewReady(false);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function assign(role: "body" | "heading", id: string) {
    startTransition(async () => {
      await setActiveFont(role, id || null);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteFontAsset(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {faceCss && <style dangerouslySetInnerHTML={{ __html: faceCss }} />}

      {/* Upload */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <h2 className="text-lg font-semibold">Upload a font</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Accepted formats: woff2, woff, ttf, otf. The “family name” is how the
          font is referenced in CSS — use the font’s real name (e.g. “Poppins”).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Label (shown in menus)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Poppins"
            />
          </div>
          <div>
            <Label>CSS family name</Label>
            <Input
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              placeholder="Poppins"
            />
          </div>
        </div>
        <div className="mt-3">
          <input
            ref={fileRef}
            type="file"
            accept=".woff2,.woff,.ttf,.otf"
            onChange={onFileChange}
            className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          {fileName && (
            <p className="mt-1 text-xs text-muted-foreground">
              Selected: {fileName}
            </p>
          )}
        </div>
        {previewUrl && (
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Preview {previewReady ? "" : "(loading…)"}
            </p>
            <p
              className="mt-1 text-2xl"
              style={
                previewReady ? { fontFamily: `'${PREVIEW_FAMILY}'` } : undefined
              }
            >
              {sample || DEFAULT_SAMPLE}
            </p>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <Button className="mt-4" onClick={upload} disabled={busy}>
          {busy ? "Uploading..." : "Upload font"}
        </Button>
      </div>

      {/* Assign active fonts */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <h2 className="text-lg font-semibold">Active fonts</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Body font</Label>
            <Select
              value={bodyFontId ?? ""}
              onChange={(e) => assign("body", e.target.value)}
              disabled={pending}
            >
              <option value="">Default (Inter)</option>
              {fonts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Heading font</Label>
            <Select
              value={headingFontId ?? ""}
              onChange={(e) => assign("heading", e.target.value)}
              disabled={pending}
            >
              <option value="">Default (Fraunces)</option>
              {fonts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Library + previews */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Font library</h2>
          <div className="w-full sm:w-72">
            <Label className="text-xs">Preview text</Label>
            <Input
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              placeholder={DEFAULT_SAMPLE}
            />
          </div>
        </div>
        {fonts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No fonts uploaded yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {fonts.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    {f.label}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({f.format})
                    </span>
                  </p>
                  <p
                    className="mt-1 text-2xl"
                    style={{ fontFamily: `'${f.family}'` }}
                  >
                    {sample || DEFAULT_SAMPLE}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => remove(f.id)}
                  disabled={pending}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
