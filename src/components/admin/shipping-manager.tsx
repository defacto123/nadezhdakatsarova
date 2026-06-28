"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import {
  saveShippingZone,
  deleteShippingZone,
  saveShippingRate,
  deleteShippingRate,
} from "@/lib/admin-actions";

export interface RateRow {
  id: string;
  name: string;
  priceCents: number;
  freeOverCents: number | null;
}
export interface ZoneRow {
  id: string;
  name: string;
  countries: string[];
  rates: RateRow[];
}

export function ShippingManager({ zones }: { zones: ZoneRow[] }) {
  const router = useRouter();
  const [zoneName, setZoneName] = useState("");
  const [zoneCountries, setZoneCountries] = useState("");

  async function addZone(e: React.FormEvent) {
    e.preventDefault();
    await saveShippingZone({
      name: zoneName,
      countries: zoneCountries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean),
      sortOrder: zones.length,
    });
    setZoneName("");
    setZoneCountries("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {zones.map((z) => (
        <ZoneCard key={z.id} zone={z} onChange={() => router.refresh()} />
      ))}

      <form
        onSubmit={addZone}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-border bg-white p-5"
      >
        <div>
          <Label>New zone name</Label>
          <Input
            required
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            placeholder="e.g. Bulgaria"
          />
        </div>
        <div className="flex-1">
          <Label>Countries (comma ISO codes, or *)</Label>
          <Input
            required
            value={zoneCountries}
            onChange={(e) => setZoneCountries(e.target.value)}
            placeholder="BG  or  *"
          />
        </div>
        <Button type="submit">Add zone</Button>
      </form>
    </div>
  );
}

function ZoneCard({ zone, onChange }: { zone: ZoneRow; onChange: () => void }) {
  const [rateName, setRateName] = useState("");
  const [priceEuros, setPriceEuros] = useState("");
  const [freeOverEuros, setFreeOverEuros] = useState("");

  async function addRate(e: React.FormEvent) {
    e.preventDefault();
    await saveShippingRate({
      zoneId: zone.id,
      name: rateName,
      priceCents: Math.round(parseFloat(priceEuros || "0") * 100),
      freeOverCents: freeOverEuros
        ? Math.round(parseFloat(freeOverEuros) * 100)
        : null,
      sortOrder: zone.rates.length,
    });
    setRateName("");
    setPriceEuros("");
    setFreeOverEuros("");
    onChange();
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{zone.name}</h3>
          <p className="text-xs text-muted-foreground">
            {zone.countries.join(", ")}
          </p>
        </div>
        <button
          onClick={async () => {
            if (confirm("Delete zone?")) {
              await deleteShippingZone(zone.id);
              onChange();
            }
          }}
          className="text-xs text-red-600 hover:underline"
        >
          Delete zone
        </button>
      </div>

      <div className="divide-y divide-border">
        {zone.rates.map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2 text-sm">
            <span>{r.name}</span>
            <span className="flex items-center gap-3">
              <span>{formatPrice(r.priceCents)}</span>
              {r.freeOverCents != null && (
                <span className="text-xs text-muted-foreground">
                  free over {formatPrice(r.freeOverCents)}
                </span>
              )}
              <button
                onClick={async () => {
                  await deleteShippingRate(r.id);
                  onChange();
                }}
                className="text-xs text-red-600 hover:underline"
              >
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={addRate} className="mt-3 flex flex-wrap items-end gap-2">
        <Input
          required
          placeholder="Rate name"
          value={rateName}
          onChange={(e) => setRateName(e.target.value)}
          className="w-40"
        />
        <Input
          required
          type="number"
          step="0.01"
          placeholder="Price EUR"
          value={priceEuros}
          onChange={(e) => setPriceEuros(e.target.value)}
          className="w-28"
        />
        <Input
          type="number"
          step="0.01"
          placeholder="Free over EUR"
          value={freeOverEuros}
          onChange={(e) => setFreeOverEuros(e.target.value)}
          className="w-32"
        />
        <Button type="submit" variant="outline" size="sm">
          Add rate
        </Button>
      </form>
    </div>
  );
}
