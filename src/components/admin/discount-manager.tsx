"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveDiscount, deleteDiscount } from "@/lib/admin-actions";
import { formatPrice } from "@/lib/money";

export interface DiscountRow {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderCents: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  expiresAt: string | null;
  active: boolean;
}

const empty = {
  code: "",
  type: "PERCENT" as "PERCENT" | "FIXED",
  valueInput: "",
  minOrderEuros: "",
  usageLimit: "",
  perUserLimit: "",
  expiresAt: "",
  active: true,
};

export function DiscountManager({ discounts }: { discounts: DiscountRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [saving, setSaving] = useState(false);

  function edit(d: DiscountRow) {
    setForm({
      id: d.id,
      code: d.code,
      type: d.type,
      valueInput:
        d.type === "PERCENT" ? String(d.value) : (d.value / 100).toFixed(2),
      minOrderEuros: d.minOrderCents ? (d.minOrderCents / 100).toFixed(2) : "",
      usageLimit: d.usageLimit ? String(d.usageLimit) : "",
      perUserLimit: d.perUserLimit ? String(d.perUserLimit) : "",
      expiresAt: d.expiresAt ? d.expiresAt.slice(0, 10) : "",
      active: d.active,
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const value =
        form.type === "PERCENT"
          ? parseInt(form.valueInput || "0", 10)
          : Math.round(parseFloat(form.valueInput || "0") * 100);
      await saveDiscount({
        id: form.id,
        code: form.code,
        type: form.type,
        value,
        minOrderCents: form.minOrderEuros
          ? Math.round(parseFloat(form.minOrderEuros) * 100)
          : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
        perUserLimit: form.perUserLimit ? parseInt(form.perUserLimit, 10) : null,
        expiresAt: form.expiresAt || null,
        active: form.active,
      });
      setForm(empty);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete code?")) return;
    await deleteDiscount(id);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {discounts.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <button onClick={() => edit(d)} className="font-mono font-medium hover:text-primary">
                    {d.code}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {d.type === "PERCENT" ? `${d.value}%` : formatPrice(d.value)}
                </td>
                <td className="px-4 py-3">
                  {d.usedCount}
                  {d.usageLimit ? ` / ${d.usageLimit}` : ""}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={d.active ? "success" : "neutral"}>
                    {d.active ? "Active" : "Off"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(d.id)} className="text-xs text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {discounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No discount codes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} className="h-fit space-y-3 rounded-2xl border border-border bg-white p-5">
        <h2 className="font-semibold">{form.id ? "Edit" : "New"} code</h2>
        <div>
          <Label>Code</Label>
          <Input
            required
            value={form.code}
            onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Type</Label>
            <Select
              value={form.type}
              onChange={(e) =>
                setForm((s) => ({ ...s, type: e.target.value as "PERCENT" | "FIXED" }))
              }
            >
              <option value="PERCENT">Percent %</option>
              <option value="FIXED">Fixed EUR</option>
            </Select>
          </div>
          <div>
            <Label>{form.type === "PERCENT" ? "Percent" : "Amount (EUR)"}</Label>
            <Input
              type="number"
              step={form.type === "PERCENT" ? "1" : "0.01"}
              required
              value={form.valueInput}
              onChange={(e) => setForm((s) => ({ ...s, valueInput: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label>Min order (EUR, optional)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.minOrderEuros}
            onChange={(e) => setForm((s) => ({ ...s, minOrderEuros: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Usage limit</Label>
            <Input
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm((s) => ({ ...s, usageLimit: e.target.value }))}
            />
          </div>
          <div>
            <Label>Per user</Label>
            <Input
              type="number"
              value={form.perUserLimit}
              onChange={(e) => setForm((s) => ({ ...s, perUserLimit: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label>Expires at</Label>
          <Input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm((s) => ({ ...s, expiresAt: e.target.value }))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
          />
          Active
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "..." : "Save"}
          </Button>
          {form.id && (
            <Button type="button" variant="ghost" onClick={() => setForm(empty)}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
