-- Decorative images interleaved with the boutique feed.
CREATE TABLE "BoutiqueImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altBg" TEXT,
    "altEn" TEXT,
    "animated" BOOLEAN NOT NULL DEFAULT false,
    "motion" TEXT NOT NULL DEFAULT 'float',
    "speed" INTEGER NOT NULL DEFAULT 4,
    "bgColor" TEXT,
    "position" TEXT NOT NULL DEFAULT 'center',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoutiqueImage_pkey" PRIMARY KEY ("id")
);
