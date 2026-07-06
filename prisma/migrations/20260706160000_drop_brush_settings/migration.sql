-- The header brush is now rendered as its original uploaded PNG (colours and
-- transparency preserved) instead of a tinted CSS mask, so the hue / saturation
-- / opacity controls are removed. Drop their columns from SiteTheme.
ALTER TABLE "SiteTheme" DROP COLUMN IF EXISTS "brushHue";
ALTER TABLE "SiteTheme" DROP COLUMN IF EXISTS "brushSaturate";
ALTER TABLE "SiteTheme" DROP COLUMN IF EXISTS "brushOpacity";
