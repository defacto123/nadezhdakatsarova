import { NextResponse } from "next/server";
import { imageSize } from "image-size";
import { auth } from "@/auth";
import { uploadImage } from "@/lib/gcs";
import { imageSlot } from "@/lib/site-design";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const slotName = formData.get("slot");
  const folder = (formData.get("folder") as string) || "products";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "not an image" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let width: number | undefined;
  let height: number | undefined;
  try {
    const dim = imageSize(buffer);
    width = dim.width;
    height = dim.height;
  } catch {
    // dimensions unknown (e.g. some SVGs) — only an error if a slot requires them
  }

  // Enforce exact dimensions for named slots.
  if (typeof slotName === "string" && slotName) {
    const slot = imageSlot(slotName);
    if (!slot) {
      return NextResponse.json({ error: "unknown slot" }, { status: 400 });
    }
    if (!width || !height) {
      return NextResponse.json(
        { error: "Could not read image dimensions." },
        { status: 400 },
      );
    }
    if (width !== slot.width || height !== slot.height) {
      return NextResponse.json(
        {
          error: `Wrong dimensions: ${width}×${height}px. This slot requires exactly ${slot.width}×${slot.height}px.`,
        },
        { status: 400 },
      );
    }
  }

  const url = await uploadImage(buffer, file.type, folder);
  return NextResponse.json({ url, width, height });
}
