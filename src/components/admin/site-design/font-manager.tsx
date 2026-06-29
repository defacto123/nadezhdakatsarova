"use client";

import { useRef, useState, useTransition } from "react";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // @font-face declarations so previews render in the actual uploaded fonts.
  const faceCss = fonts
    .map(
      (f) =>
        `@font-face{font-family:'${f.family.replace(/['"\\]/g, "")}';src:url('${f.url}') format('${SRC_FORMAT[f.format] ?? f.format}');font-display:swap;}`,
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
            accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
            className="block text-sm"
          />
        </div>
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
              defaultValue={bodyFontId ?? ""}
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
              defaultValue={headingFontId ?? ""}
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
        <h2 className="text-lg font-semibold">Font library</h2>
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
                    The quick brown fox · Бърза кафява лисица
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
