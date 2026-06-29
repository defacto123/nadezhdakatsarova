"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  saveSocialLink,
  deleteSocialLink,
  type SocialLinkInput,
} from "@/lib/admin-actions";

export type SocialLinkData = SocialLinkInput & { id: string };

export function SocialManager({ links }: { links: SocialLinkData[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      await saveSocialLink({
        platform: "Instagram",
        url: "https://",
        sortOrder: links.length,
        active: true,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {links.length === 0 && (
        <p className="text-sm text-muted-foreground">No social links yet.</p>
      )}
      {links.map((l) => (
        <LinkCard key={l.id} link={l} />
      ))}
      <Button onClick={add} disabled={pending}>
        + Add link
      </Button>
    </div>
  );
}

function LinkCard({ link }: { link: SocialLinkData }) {
  const router = useRouter();
  const [l, setL] = useState<SocialLinkData>(link);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await saveSocialLink(l);
      setSaved(true);
      router.refresh();
    });
  }
  function remove() {
    startTransition(async () => {
      await deleteSocialLink(l.id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="grid items-end gap-3 sm:grid-cols-[160px_1fr_100px_auto]">
        <div>
          <Label className="text-xs">Platform</Label>
          <Input
            value={l.platform}
            onChange={(e) => {
              setL({ ...l, platform: e.target.value });
              setSaved(false);
            }}
          />
        </div>
        <div>
          <Label className="text-xs">URL</Label>
          <Input
            value={l.url}
            onChange={(e) => {
              setL({ ...l, url: e.target.value });
              setSaved(false);
            }}
          />
        </div>
        <div>
          <Label className="text-xs">Order</Label>
          <Input
            type="number"
            value={l.sortOrder}
            onChange={(e) => {
              setL({ ...l, sortOrder: Number(e.target.value) });
              setSaved(false);
            }}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={l.active}
            onChange={(e) => {
              setL({ ...l, active: e.target.checked });
              setSaved(false);
            }}
          />
          Active
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button onClick={save} disabled={pending}>
          Save
        </Button>
        <Button variant="ghost" onClick={remove} disabled={pending}>
          Delete
        </Button>
        {saved && <span className="text-sm text-sage-dark">Saved</span>}
      </div>
    </div>
  );
}
