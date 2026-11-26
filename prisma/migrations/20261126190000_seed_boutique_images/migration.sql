-- Demo decorative images for the boutique feed so the layout can be seen right
-- away. Only inserted when there are no boutique images yet (never overwrites
-- CMS content). The PNGs ship in /public/decor. Editable/removable in the CMS
-- under Boutique -> Boutique images.

INSERT INTO "BoutiqueImage"
  (id, url, "altBg", "altEn", animated, motion, speed, "bgColor", position,
   "sortOrder", active, "createdAt", "updatedAt")
SELECT * FROM (VALUES
  ('demo-boutique-img-1', '/decor/flowers.png', 'Цветя', 'Flowers', true, 'sway', 4, NULL::text, 'left', 0, true, now(), now()),
  ('demo-boutique-img-2', '/decor/brushes.png', 'Четки', 'Brushes', true, 'float', 5, NULL::text, 'right', 1, true, now(), now()),
  ('demo-boutique-img-3', '/decor/chair.png', 'Стол', 'Chair', true, 'rock', 3, NULL::text, 'center', 2, true, now(), now())
) AS v
WHERE NOT EXISTS (SELECT 1 FROM "BoutiqueImage");
