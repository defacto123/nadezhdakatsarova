-- One-time reset of the hero carousel to the bundled demo slides so every
-- environment shows the same artwork as the seed. This intentionally REPLACES
-- any existing hero slides (per product decision) with the three demo sets:
--   1) sliding pair (float / sway)
--   2) single fade-in banner (pulse)
--   3) second pair (rock / drift)
-- The referenced PNGs ship in /public/hero. Editable/removable in the CMS after.

DELETE FROM "HeroSlide";

INSERT INTO "HeroSlide"
  (id, kind, "imageUrl", "imageUrl2", href,
   motion1, speed1, animated1, motion2, speed2, animated2,
   "bgColor", "sortOrder", active, "createdAt", "updatedAt")
VALUES
  ('demo-hero-1', 'pair', '/hero/pair-left.png', '/hero/pair-right.png', '/shop',
   'float', 4, true, 'sway', 5, true,
   '#f4efe9', 0, true, now(), now()),
  ('demo-hero-2', 'single', '/hero/single.png', NULL, '/shop',
   'pulse', 3, true, 'float', 4, true,
   NULL, 1, true, now(), now()),
  ('demo-hero-3', 'pair', '/hero/pair2-left.png', '/hero/pair2-right.png', '/shop',
   'rock', 6, true, 'drift', 4, true,
   '#eef0ec', 2, true, now(), now());
