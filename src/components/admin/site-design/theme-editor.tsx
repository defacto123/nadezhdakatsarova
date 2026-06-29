"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import {
  THEME_COLOR_FIELDS,
  DEFAULT_THEME,
  type ThemeValues,
} from "@/lib/site-design";
import { saveSiteTheme, type SiteThemeInput } from "@/lib/admin-actions";

type FontOption = { id: string; label: string; family: string };

export function ThemeEditor({
  initial,
  fonts,
}: {
  initial: SiteThemeInput;
  fonts: FontOption[];
}) {
  const [values, setValues] = useState<SiteThemeInput>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function setColor(field: keyof ThemeValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await saveSiteTheme(values);
      setSaved(true);
    });
  }

  function reset() {
    setValues((v) => ({ ...v, ...DEFAULT_THEME }));
    setSaved(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="grid gap-4 sm:grid-cols-2">
          {THEME_COLOR_FIELDS.map((f) => {
            const value = values[f.field] as string;
            return (
              <div key={f.field} className="rounded-2xl border border-border bg-white p-3">
                <Label className="mb-1">{f.label}</Label>
                <p className="mb-2 text-xs text-muted-foreground">{f.help}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setColor(f.field, e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-white"
                    aria-label={f.label}
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setColor(f.field, e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-white px-3 font-mono text-sm uppercase"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-white p-4">
          <Label className="mb-1">Corner radius: {values.radiusRem.toFixed(2)}rem</Label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={values.radiusRem}
            onChange={(e) => {
              setValues((v) => ({ ...v, radiusRem: Number(e.target.value) }));
              setSaved(false);
            }}
            className="w-full"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Body font</Label>
            <Select
              value={values.bodyFontId ?? ""}
              onChange={(e) => {
                setValues((v) => ({ ...v, bodyFontId: e.target.value || null }));
                setSaved(false);
              }}
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
              value={values.headingFontId ?? ""}
              onChange={(e) => {
                setValues((v) => ({ ...v, headingFontId: e.target.value || null }));
                setSaved(false);
              }}
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
        <p className="mt-2 text-xs text-muted-foreground">
          Upload fonts in the Fonts tab first, then assign them here.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving..." : "Save theme"}
          </Button>
          <Button variant="outline" onClick={reset} disabled={pending}>
            Reset to defaults
          </Button>
          {saved && <span className="text-sm text-sage-dark">Saved</span>}
        </div>
      </div>

      {/* Live preview */}
      <div
        className="h-fit rounded-3xl border p-6"
        style={{
          background: values.colorBackground,
          color: values.colorForeground,
          borderColor: values.colorBorder,
          borderRadius: `${values.radiusRem + 0.6}rem`,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: values.colorMutedText }}>
          Live preview
        </p>
        <h3 className="mt-2 text-2xl font-semibold">Hand-drawn art</h3>
        <p className="mt-1 text-sm" style={{ color: values.colorMutedText }}>
          A little preview of your storefront colours.
        </p>
        <div
          className="mt-4 overflow-hidden"
          style={{
            background: values.colorSurface,
            borderRadius: `${values.radiusRem}rem`,
          }}
        >
          <div className="p-4">
            <span
              className="inline-block px-2 py-0.5 text-xs font-semibold uppercase text-white"
              style={{ background: values.colorSale, borderRadius: "999px" }}
            >
              -20%
            </span>
            <p className="mt-2 text-sm font-medium">Sample product</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <span
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: values.colorPrimary, borderRadius: "999px" }}
          >
            Primary
          </span>
          <span
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ background: values.colorSecondary, borderRadius: "999px" }}
          >
            Secondary
          </span>
        </div>
      </div>
    </div>
  );
}
