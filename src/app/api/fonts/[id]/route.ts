import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Serve uploaded font files through the app's own origin. Browsers fetch
// @font-face files with CORS, and a public GCS bucket without a CORS policy
// blocks cross-origin font loads. Proxying keeps fonts same-origin so they load
// on both the storefront and the CMS preview without any bucket configuration.

const CONTENT_TYPE: Record<string, string> = {
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
  otf: "font/otf",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let font: { url: string; format: string } | null = null;
  try {
    font = await prisma.fontAsset.findUnique({
      where: { id },
      select: { url: true, format: true },
    });
  } catch {
    return new NextResponse("error", { status: 500 });
  }
  if (!font) return new NextResponse("not found", { status: 404 });

  let body: ArrayBuffer;
  if (font.url.startsWith("data:")) {
    const base64 = font.url.split(",")[1] ?? "";
    const buf = Buffer.from(base64, "base64");
    body = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;
  } else {
    const upstream = await fetch(font.url);
    if (!upstream.ok) return new NextResponse("upstream error", { status: 502 });
    body = await upstream.arrayBuffer();
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": CONTENT_TYPE[font.format] ?? "font/woff2",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
