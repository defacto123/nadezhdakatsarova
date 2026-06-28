"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveCampaign, sendCampaignNow } from "@/lib/admin-actions";

export interface CampaignRow {
  id: string;
  subject: string;
  status: string;
  recipientCount: number;
  sentAt: string | null;
  createdAt: string;
}

export function CampaignComposer({
  campaigns,
  recipientCount,
}: {
  campaigns: CampaignRow[];
  recipientCount: number;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveDraft() {
    setBusy(true);
    setMessage(null);
    try {
      await saveCampaign({ subject, preheader: preheader || null, bodyHtml });
      setSubject("");
      setPreheader("");
      setBodyHtml("");
      setMessage("Draft saved.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveAndSend() {
    setBusy(true);
    setMessage(null);
    try {
      const { id } = await saveCampaign({
        subject,
        preheader: preheader || null,
        bodyHtml,
      });
      const res = await sendCampaignNow(id);
      setMessage(`Sent to ${res.recipientCount} subscribers.`);
      setSubject("");
      setPreheader("");
      setBodyHtml("");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendExisting(id: string) {
    if (!confirm("Send this campaign now?")) return;
    setBusy(true);
    try {
      const res = await sendCampaignNow(id);
      setMessage(`Sent to ${res.recipientCount} subscribers.`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-semibold">New campaign</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Will be sent to {recipientCount} subscribed contacts via Resend.
        </p>
        <div className="space-y-3">
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label>Preheader</Label>
            <Input
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
            />
          </div>
          <div>
            <Label>Body (HTML)</Label>
            <Textarea
              rows={10}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="<h1>Hello!</h1><p>New drops are here...</p>"
            />
          </div>
          {message && <p className="text-sm text-primary">{message}</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveDraft} disabled={busy || !subject}>
              Save draft
            </Button>
            <Button onClick={saveAndSend} disabled={busy || !subject || !bodyHtml}>
              {busy ? "Sending..." : "Save & send"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-4 font-semibold">Campaigns</h2>
        <div className="divide-y divide-border">
          {campaigns.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium">{c.subject}</div>
                <div className="text-xs text-muted-foreground">
                  {c.sentAt
                    ? `Sent ${new Date(c.sentAt).toLocaleDateString()} · ${c.recipientCount}`
                    : new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    c.status === "SENT"
                      ? "success"
                      : c.status === "FAILED"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {c.status}
                </Badge>
                {c.status === "DRAFT" && (
                  <button
                    onClick={() => sendExisting(c.id)}
                    disabled={busy}
                    className="text-xs text-primary hover:underline"
                  >
                    Send
                  </button>
                )}
              </div>
            </div>
          ))}
          {campaigns.length === 0 && (
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
