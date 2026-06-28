"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterSignup() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "ok" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <p className="rounded-xl bg-white px-4 py-3 text-sm text-sage-dark">
        {t("success")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        type="email"
        required
        placeholder={t("placeholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-white"
      />
      <Button type="submit" disabled={status === "loading"}>
        {t("subscribe")}
      </Button>
    </form>
  );
}
