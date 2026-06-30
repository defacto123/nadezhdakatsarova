-- Point the default decorative site-image slots at the bundled transparent PNGs
-- (served from /public/decor). Guarded so this only touches slots that still
-- hold a generated placeholder (data: URI); any real image already uploaded via
-- the CMS (http/https/GCS URL) is left untouched. Safe + idempotent.

UPDATE "SiteImage"
SET url = '/decor/flowers.png', width = 700, height = 900,
    animated = true, motion = 'float', speed = 3, "bgColor" = NULL
WHERE slot = 'home-side-1' AND url LIKE 'data:%';

UPDATE "SiteImage"
SET url = '/decor/books.png', width = 700, height = 900,
    animated = false, motion = 'float', speed = 4, "bgColor" = NULL
WHERE slot = 'home-side-2' AND url LIKE 'data:%';

UPDATE "SiteImage"
SET url = '/decor/brushes.png', width = 700, height = 900,
    animated = true, motion = 'sway', speed = 3, "bgColor" = NULL
WHERE slot = 'home-side-3' AND url LIKE 'data:%';

UPDATE "SiteImage"
SET url = '/decor/chair.png', width = 1000, height = 1200,
    animated = false, motion = 'float', speed = 4, "bgColor" = NULL
WHERE slot = 'about-portrait' AND url LIKE 'data:%';
