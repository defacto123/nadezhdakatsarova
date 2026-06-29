import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadAsset } from "@/lib/gcs";

export const runtime = "nodejs";

const EXT_CONTENT_TYPE: Record<string, string> = {
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
  otf: "font/otf",
};

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const contentType = EXT_CONTENT_TYPE[ext];
  if (!contentType) {
    return NextResponse.json(
      { error: "Unsupported font format. Use woff2, woff, ttf or otf." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadAsset(buffer, contentType, "fonts", ext);
  return NextResponse.json({ url, ext });
}
