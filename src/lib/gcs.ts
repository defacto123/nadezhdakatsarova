import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

let storage: Storage | null = null;

function getStorage(): Storage {
  if (!storage) {
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
 * Upload an image buffer to GCS and return its public URL.
 * Falls back to a data URL when GCS is not configured (useful for local dev).
 */
export async function uploadImage(
  buffer: Buffer,
  contentType: string,
  folder = "products",
): Promise<string> {
  const ext = contentType.split("/")[1] ?? "bin";
  const objectName = `${folder}/${randomUUID()}.${ext}`;

  if (!isGcsConfigured()) {
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }

  const bucket = getStorage().bucket(process.env.GCS_BUCKET as string);
  const file = bucket.file(objectName);
  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });
  return `${PUBLIC_BASE}/${objectName}`;
}
