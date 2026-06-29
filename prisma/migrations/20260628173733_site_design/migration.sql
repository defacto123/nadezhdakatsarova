-- CreateTable
CREATE TABLE "FontAsset" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FontAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteTheme" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "colorBackground" TEXT NOT NULL DEFAULT '#fbf7f0',
    "colorForeground" TEXT NOT NULL DEFAULT '#2b2622',
    "colorMutedText" TEXT NOT NULL DEFAULT '#6b6258',
    "colorPrimary" TEXT NOT NULL DEFAULT '#c4633f',
    "colorPrimaryHover" TEXT NOT NULL DEFAULT '#a64f30',
    "colorSecondary" TEXT NOT NULL DEFAULT '#7d8a6a',
    "colorSecondaryHover" TEXT NOT NULL DEFAULT '#5f6b4f',
    "colorAccent" TEXT NOT NULL DEFAULT '#e9c7b8',
    "colorSurface" TEXT NOT NULL DEFAULT '#f1e8da',
    "colorBorder" TEXT NOT NULL DEFAULT '#e6dccb',
    "colorSale" TEXT NOT NULL DEFAULT '#c4633f',
    "radiusRem" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "bodyFontId" TEXT,
    "headingFontId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteImage" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altBg" TEXT,
    "altEn" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueBg" TEXT NOT NULL,
    "valueEn" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "eyebrowBg" TEXT,
    "eyebrowEn" TEXT,
    "headlineBg" TEXT,
    "headlineEn" TEXT,
    "subtextBg" TEXT,
    "subtextEn" TEXT,
    "imageUrl" TEXT,
    "ctaLabelBg" TEXT,
    "ctaLabelEn" TEXT,
    "ctaHref" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteImage_slot_key" ON "SiteImage"("slot");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_key_key" ON "ContentBlock"("key");

-- AddForeignKey
ALTER TABLE "SiteTheme" ADD CONSTRAINT "SiteTheme_bodyFontId_fkey" FOREIGN KEY ("bodyFontId") REFERENCES "FontAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteTheme" ADD CONSTRAINT "SiteTheme_headingFontId_fkey" FOREIGN KEY ("headingFontId") REFERENCES "FontAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

