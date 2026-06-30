-- AlterTable: per-image animated flags on hero slides
ALTER TABLE "HeroSlide" ADD COLUMN     "animated1" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "animated2" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: animation + background controls on site images
ALTER TABLE "SiteImage" ADD COLUMN     "animated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "motion" TEXT NOT NULL DEFAULT 'float',
ADD COLUMN     "speed" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "bgColor" TEXT;
