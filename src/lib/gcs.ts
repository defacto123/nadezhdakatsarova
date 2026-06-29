import type { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

let storage: Storage | null = null;

// Lazily import the SDK only when GCS is actually configured. This keeps the
// large dependency out of the dev/build graph for local development (which
// uses the data-URL fallback), where it otherwise made upload routes hang.
async function getStorage(): Promise<Storage> {
  if (!storage) {
    const { Storage } = await import("@google-cloud/storage");
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID || undefined,
    });
  }
  return storage;
}

export function isGcsConfigured(): boolean {
  return Boolean(process.env.GCS_BUCKET);
}

const PUBLIC_BASE =
  process.env.NEXT_PUBLIC_GCS_PUBLIC_BASE ||
  (process.env.GCS_BUCKET
    ? `https://storage.googleapis.com/${process.env.GCS_BUCKET}`
    : "");

/**
 * Upload an arbitrary asset buffer to GCS and return its public URL.
 * Falls back to a data URL when GCS is not configured (useful for local dev).
 */
export async function uploadAsset(
  buffer: Buffer,
  contentType: string,
  folder: string,
  ext: string,
): Promise<string> {
  const objectName = `${folder}/${randomUUID()}.${ext}`;

  if (!isGcsConfigured()) {
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }

  const bucket = (await getStorage()).bucket(process.env.GCS_BUCKET as string);
  const file = bucket.file(objectName);
  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });
  return `${PUBLIC_BASE}/${objectName}`;
}

/**
 * Upload an image buffer to GCS and return its public URL.
 */
export async function uploadImage(
  buffer: Buffer,
  contentType: string,
  folder = "products",
): Promise<string> {
  const ext = contentType.split("/")[1] ?? "bin";
  return uploadAsset(buffer, contentType, folder, ext);
}
