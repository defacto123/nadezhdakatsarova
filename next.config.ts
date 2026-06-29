import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const gcsBase = process.env.NEXT_PUBLIC_GCS_PUBLIC_BASE;
let gcsRemotePattern: { protocol: "https"; hostname: string } | null = null;
if (gcsBase) {
  try {
    const url = new URL(gcsBase);
    gcsRemotePattern = { protocol: "https", hostname: url.hostname };
  } catch {
    gcsRemotePattern = null;
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep the heavy Google Cloud SDK out of the bundler; load it at runtime via
  // require. Avoids extremely slow / hanging dev compiles of the upload routes.
  serverExternalPackages: ["@google-cloud/storage"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      ...(gcsRemotePattern ? [gcsRemotePattern] : []),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default withNextIntl(nextConfig);
