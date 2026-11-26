"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import {
  addToBoutique,
  moveBoutiqueItem,
  removeFromBoutique,
} from "@/lib/admin-actions";
import { formatPrice } from "@/lib/money";
import { isRawImage } from "@/lib/utils";

export interface BoutiqueRow {
  id: string;
  slug: string;
  titleEn: string;
  titleBg: string;
  priceCents: number;
  salePercent: number | null;
  active: boolean;
  image: string | null;
  stock: number | null;
}

export function BoutiqueManager({
  items,
  others,
}: {
  items: BoutiqueRow[];
  others: { id: string; titleEn: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pick, setPick] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <ul className="divide-y divide-border">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-center gap-4 px-4 py-3">
              <span className="w-6 text-center text-xs text-muted-foreground">
                {i + 1}
              </span>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {p.image && (
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized={isRawImage(p.image)}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/boutique/${p.id}`}
                  className="block truncate font-medium hover:text-primary"
                >
                  {p.titleEn}
                </Link>
                <div className="truncate text-xs text-muted-foreground">
                  {p.titleBg} · {formatPrice(p.priceCents)}
                  {p.salePercent ? ` · -${p.salePercent}%` : ""}
                  {p.stock != null ? ` · stock ${p.stock}` : ""}
                </div>
              </div>
              <Badge variant={p.active ? "success" : "neutral"}>
                {p.active ? "Active" : "Hidden"}
              </Badge>
              <div className="flex items-center gap-1">
                <IconBtn
                  label="Move up"
                  disabled={pending || i === 0}
                  onClick={() => run(() => moveBoutiqueItem(p.id, "up"))}
                >
                  <ArrowUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  label="Move down"
                  disabled={pending || i === items.length - 1}
                  onClick={() => run(() => moveBoutiqueItem(p.id, "down"))}
                >
                  <ArrowDown className="h-4 w-4" />
                </IconBtn>
                <Link
                  href={`/admin/boutique/${p.id}`}
                  aria-label="Edit"
                  title="Edit"
                  className="rounded-lg p-2 hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <IconBtn
                  label="Remove from boutique"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Remove “${p.titleEn}” from the boutique? The product itself is kept.`))
                      run(() => removeFromBoutique(p.id));
                  }}
                >
                  <X className="h-4 w-4 text-red-600" />
                </IconBtn>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              The boutique is empty. Add a new item or an existing product.
            </li>
          )}
        </ul>
      </div>

      {others.length > 0 && (
        <div className="flex max-w-xl items-end gap-3">
          <div className="flex-1">
            <span className="mb-1 block text-sm font-medium">
              Add an existing product
            </span>
            <Select value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Choose a product…</option>
              {others.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.titleEn}
                </option>
              ))}
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!pick || pending}
            onClick={() =>
              run(async () => {
                await addToBoutique(pick);
                setPick("");
              })
            }
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
    >
      {children}
    </button>
  );
}
