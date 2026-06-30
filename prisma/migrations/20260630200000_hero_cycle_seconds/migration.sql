-- Global total cycle time (seconds) for the hero carousel. Each slide shows for
-- heroCycleSeconds / number-of-slides, so timing adapts to the slide count.
ALTER TABLE "SiteTheme" ADD COLUMN "heroCycleSeconds" INTEGER NOT NULL DEFAULT 24;
