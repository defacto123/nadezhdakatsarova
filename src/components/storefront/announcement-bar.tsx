"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function AnnouncementBar({ text }: { text: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden || !text) return null;

  const items = Array.from({ length: 6 }, (_, i) => (
    <span key={i} className="mx-6 inline-flex items-center gap-2">
      {text}
      <span aria-hidden>•</span>
    </span>
  ));

  return (
    <div className="relative overflow-hidden bg-[var(--color-accent)] py-2 text-[11px] uppercase tracking-[0.2em] text-ink">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        <div className="flex">{items}</div>
        <div className="flex" aria-hidden>
          {items}
        </div>
      </div>
      <button
        onClick={() => setHidden(true)}
        aria-label="Dismiss"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/60 hover:text-ink"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
