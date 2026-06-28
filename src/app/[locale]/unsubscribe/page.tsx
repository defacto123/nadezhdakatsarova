"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setDone(true);
  }

  return (
    <div className="container-page max-w-md py-20">
      <h1 className="heading-display text-3xl">Unsubscribe</h1>
      {done ? (
        <p className="mt-4 text-muted-foreground">
          You have been unsubscribed. We&apos;re sorry to see you go.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 flex gap-2">
          <Input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit">Unsubscribe</Button>
        </form>
      )}
    </div>
  );
}
