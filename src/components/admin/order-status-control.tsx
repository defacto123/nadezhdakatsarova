"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { updateOrderStatus } from "@/lib/admin-actions";

const STATUSES = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
] as const;

export function OrderStatusControl({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    setValue(next);
    setSaving(true);
    await updateOrderStatus(id, next as (typeof STATUSES)[number]);
    setSaving(false);
    router.refresh();
  }

  return (
    <Select
      value={value}
      disabled={saving}
      onChange={(e) => change(e.target.value)}
      className="w-44"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}
