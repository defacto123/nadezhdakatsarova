"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import {
  CONTENT_REGISTRY,
  CONTENT_GROUPS,
  type ContentMap,
} from "@/lib/site-design";
import { saveContentBlocks } from "@/lib/admin-actions";

type Values = Record<string, { valueBg: string; valueEn: string }>;

export function ContentEditor({ initial }: { initial: ContentMap }) {
  const [values, setValues] = useState<Values>(() => {
    const v: Values = {};
    for (const item of CONTENT_REGISTRY) {
      const row = initial[item.key];
      v[item.key] = {
        valueBg: row?.valueBg ?? item.defaultBg,
        valueEn: row?.valueEn ?? item.defaultEn,
      };
    }
    return v;
  });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function set(key: string, lang: "valueBg" | "valueEn", val: string) {
    setValues((v) => ({ ...v, [key]: { ...v[key], [lang]: val } }));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await saveContentBlocks(
        CONTENT_REGISTRY.map((i) => ({
          key: i.key,
          valueBg: values[i.key].valueBg,
          valueEn: values[i.key].valueEn,
        })),
      );
      setSaved(true);
    });
  }

  return (
    <div className="space-y-8">
      {CONTENT_GROUPS.map((group) => {
        const items = CONTENT_REGISTRY.filter((i) => i.group === group);
        if (items.length === 0) return null;
        return (
          <section
            key={group}
            className="rounded-2xl border border-border bg-white p-5"
          >
            <h2 className="text-lg font-semibold">{group}</h2>
            <div className="mt-4 space-y-5">
              {items.map((item) => (
                <div key={item.key}>
                  <Label>{item.label}</Label>
                  {item.help && (
                    <p className="mb-1 text-xs text-muted-foreground">
                      {item.help}
                    </p>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <span className="mb-1 block text-xs text-muted-foreground">
                        Bulgarian
                      </span>
                      {item.multiline ? (
                        <Textarea
                          value={values[item.key].valueBg}
                          onChange={(e) =>
                            set(item.key, "valueBg", e.target.value)
                          }
                        />
                      ) : (
                        <Input
                          value={values[item.key].valueBg}
                          onChange={(e) =>
                            set(item.key, "valueBg", e.target.value)
                          }
                        />
                      )}
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-muted-foreground">
                        English
                      </span>
                      {item.multiline ? (
                        <Textarea
                          value={values[item.key].valueEn}
                          onChange={(e) =>
                            set(item.key, "valueEn", e.target.value)
                          }
                        />
                      ) : (
                        <Input
                          value={values[item.key].valueEn}
                          onChange={(e) =>
                            set(item.key, "valueEn", e.target.value)
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl border border-border bg-white/90 p-4 backdrop-blur">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving..." : "Save all content"}
        </Button>
        {saved && <span className="text-sm text-sage-dark">Saved</span>}
      </div>
    </div>
  );
}
