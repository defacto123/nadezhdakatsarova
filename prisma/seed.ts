import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CONTENT_REGISTRY, DEFAULT_THEME } from "../src/lib/site-design";

const prisma = new PrismaClient();

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

// Soft watercolor-style SVG placeholder (data URL). Looks like loose washes of
// colour so the layout reads like a finished art shop; swap real photos in the CMS.
const WASH = ["#b76e5b", "#8a9a86", "#e8d3c7", "#9fb3c8", "#d8b08c", "#c9a3b0"];

function placeholder(
  w: number,
  h: number,
  seed: number,
  label?: string,
): string {
  const rand = (n: number) => {
    const x = Math.sin(seed * 99.7 + n * 12.3) * 43758.5453;
    return x - Math.floor(x);
  };
  const blobCount = 6;
  let blobs = "";
  for (let i = 0; i < blobCount; i++) {
    const cx = Math.round(rand(i) * w);
    const cy = Math.round(rand(i + 50) * h);
    const r = Math.round((0.18 + rand(i + 100) * 0.28) * Math.min(w, h));
    const color = WASH[(seed + i) % WASH.length];
    const op = (0.45 + rand(i + 150) * 0.35).toFixed(2);
    blobs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${op}"/>`;
  }
  const blur = Math.round(Math.min(w, h) / 10);
  const text = label
    ? `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="${Math.round(Math.min(w, h) / 9)}" fill="#2c2a28" opacity="0.85">${label}</text>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><rect width="100%" height="100%" fill="#fdfcfa"/><g filter="url(#b)">${blobs}</g>${text}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

type CatDef = {
  slug: string;
  nameBg: string;
  nameEn: string;
  image: string;
  baseBg: string;
  baseEn: string;
  descBg: string;
  descEn: string;
  basePrice: number;
  images: string[];
  sizes?: string[];
};

const CATALOG: CatDef[] = [
  {
    slug: "art-prints",
    nameBg: "Арт принтове",
    nameEn: "Art Prints",
    image: IMG("photo-1513885535751-8b9238bd345a"),
    baseBg: "Арт принт",
    baseEn: "Art print",
    descBg: "Висококачествен печат върху матова хартия.",
    descEn: "High-quality giclée print on matte paper.",
    basePrice: 1800,
    images: ["photo-1513885535751-8b9238bd345a", "photo-1499951360447-b19be8fe80f5"],
    sizes: ["A5", "A4", "A3"],
  },
  {
    slug: "postcards",
    nameBg: "Картички",
    nameEn: "Postcards",
    image: IMG("photo-1467003909585-2f8a72700288"),
    baseBg: "Картичка",
    baseEn: "Postcard",
    descBg: "Илюстрирана картичка, идеална за поздрав.",
    descEn: "Illustrated postcard, perfect for a little note.",
    basePrice: 350,
    images: ["photo-1467003909585-2f8a72700288"],
  },
  {
    slug: "stickers",
    nameBg: "Стикери",
    nameEn: "Stickers",
    image: IMG("photo-1500673922987-e212871fec22"),
    baseBg: "Стикер",
    baseEn: "Sticker",
    descBg: "Водоустойчив винилов стикер с ръчна илюстрация.",
    descEn: "Waterproof vinyl sticker with a hand-drawn design.",
    basePrice: 250,
    images: ["photo-1500673922987-e212871fec22"],
  },
  {
    slug: "bookmarks",
    nameBg: "Книгоразделители",
    nameEn: "Bookmarks",
    image: IMG("photo-1499951360447-b19be8fe80f5"),
    baseBg: "Книгоразделител",
    baseEn: "Bookmark",
    descBg: "Картонен книгоразделител с пискюл.",
    descEn: "Sturdy card bookmark with a tassel.",
    basePrice: 450,
    images: ["photo-1499951360447-b19be8fe80f5"],
  },
  {
    slug: "pins-charms",
    nameBg: "Значки и аксесоари",
    nameEn: "Pins & Charms",
    image: IMG("photo-1556821840-3a63f95609a7"),
    baseBg: "Значка",
    baseEn: "Enamel pin",
    descBg: "Емайлирана значка с твърдо покритие.",
    descEn: "Hard-enamel pin with a butterfly clutch.",
    basePrice: 900,
    images: ["photo-1556821840-3a63f95609a7"],
  },
  {
    slug: "bags",
    nameBg: "Торби",
    nameEn: "Bags",
    image: IMG("photo-1591561954557-26941169b49e"),
    baseBg: "Торба",
    baseEn: "Tote bag",
    descBg: "Здрава памучна торба за пазар и разходки.",
    descEn: "Sturdy cotton tote for shopping and strolls.",
    basePrice: 1300,
    images: ["photo-1591561954557-26941169b49e"],
  },
  {
    slug: "stationery",
    nameBg: "Канцеларски материали",
    nameEn: "Stationery",
    image: IMG("photo-1521572163474-6864f9cf17ab"),
    baseBg: "Тефтер",
    baseEn: "Notebook",
    descBg: "Тефтер с твърди корици и точкова разчертаване.",
    descEn: "Hardcover dotted notebook.",
    basePrice: 1500,
    images: ["photo-1521572163474-6864f9cf17ab"],
  },
];

async function main() {
  console.log("Seeding database...");

  // Admin user. Skipped entirely when SEED_SKIP_ADMIN=1 (e.g. production seed),
  // so the insecure default credentials are never created on a live database.
  if (process.env.SEED_SKIP_ADMIN === "1") {
    console.log("Admin seeding skipped (SEED_SKIP_ADMIN=1).");
  } else {
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
    await prisma.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: { role: "ADMIN" },
      create: {
        email: adminEmail.toLowerCase(),
        name: "Store Owner",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(adminPassword, 10),
      },
    });
    // Avoid printing the password to CI logs; the email is enough to confirm.
    console.log(`Admin ready: ${adminEmail}`);
  }

  // Categories + 5 products each
  for (let ci = 0; ci < CATALOG.length; ci++) {
    const cat = CATALOG[ci];
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameBg: cat.nameBg,
        nameEn: cat.nameEn,
        image: cat.image,
        sortOrder: ci,
      },
      create: {
        slug: cat.slug,
        nameBg: cat.nameBg,
        nameEn: cat.nameEn,
        image: cat.image,
        sortOrder: ci,
      },
    });

    for (let n = 1; n <= 5; n++) {
      const slug = `${cat.slug}-${n}`;
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) continue;

      const onSale = n % 5 === 0; // 1 of 5 on sale
      const isNew = n <= 2;
      const featured = n === 1;
      const priceCents = cat.basePrice + (n - 1) * 100;

      const images = cat.images.map((id, i) => ({
        url: IMG(id),
        alt: `${cat.baseEn} ${n}`,
        sortOrder: i,
      }));

      const variants = cat.sizes
        ? cat.sizes.map((size, i) => ({
            size,
            color: null as string | null,
            stock: i === cat.sizes!.length - 1 && n === 3 ? 0 : 5 + i * 3,
            sku: `${slug}-${i}`,
            sortOrder: i,
          }))
        : [
            {
              size: null as string | null,
              color: null as string | null,
              stock: n === 4 ? 0 : 10 + n,
              sku: `${slug}-0`,
              sortOrder: 0,
            },
          ];

      await prisma.product.create({
        data: {
          slug,
          titleBg: `${cat.baseBg} №${n}`,
          titleEn: `${cat.baseEn} no. ${n}`,
          descriptionBg: cat.descBg,
          descriptionEn: cat.descEn,
          priceCents,
          salePercent: onSale ? 20 : null,
          featured,
          isNew,
          active: true,
          soldCount: Math.floor(Math.random() * 50),
          categoryId: category.id,
          images: { create: images },
          variants: { create: variants },
        },
      });
    }
  }

  // Discount code
  await prisma.discountCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENT", value: 10, active: true },
  });

  // Shipping zones
  const existingZones = await prisma.shippingZone.count();
  if (existingZones === 0) {
    await prisma.shippingZone.create({
      data: {
        name: "Bulgaria",
        countries: ["BG"],
        sortOrder: 0,
        rates: {
          create: [
            { name: "Econt / Speedy", priceCents: 499, freeOverCents: 5000, sortOrder: 0 },
          ],
        },
      },
    });
    await prisma.shippingZone.create({
      data: {
        name: "International",
        countries: ["*"],
        sortOrder: 1,
        rates: {
          create: [
            { name: "Standard EU", priceCents: 999, freeOverCents: 9000, sortOrder: 0 },
            { name: "Express", priceCents: 1999, sortOrder: 1 },
          ],
        },
      },
    });
  }

  // ---- Site Design defaults ----

  // Theme — keep the seeded palette in sync with DEFAULT_THEME.
  const themeData = {
    colorBackground: DEFAULT_THEME.colorBackground,
    colorForeground: DEFAULT_THEME.colorForeground,
    colorMutedText: DEFAULT_THEME.colorMutedText,
    colorPrimary: DEFAULT_THEME.colorPrimary,
    colorPrimaryHover: DEFAULT_THEME.colorPrimaryHover,
    colorSecondary: DEFAULT_THEME.colorSecondary,
    colorSecondaryHover: DEFAULT_THEME.colorSecondaryHover,
    colorAccent: DEFAULT_THEME.colorAccent,
    colorSurface: DEFAULT_THEME.colorSurface,
    colorBorder: DEFAULT_THEME.colorBorder,
    colorSale: DEFAULT_THEME.colorSale,
    radiusRem: DEFAULT_THEME.radiusRem,
  };
  await prisma.siteTheme.upsert({
    where: { id: "default" },
    // Don't overwrite an admin-customized palette on reseed; only create it.
    update: {},
    create: { id: "default", ...themeData },
  });

  // Site images — seed every slot with a watercolor placeholder so the whole
  // layout reads like a finished shop. Replace these in the CMS.
  const slotImages: {
    slot: string;
    w: number;
    h: number;
    seed: number;
    label?: string;
  }[] = [
    { slot: "logo", w: 480, h: 140, seed: 1, label: "Nadezhda" },
    { slot: "home-hero-art", w: 900, h: 1100, seed: 2, label: "hello" },
    { slot: "home-hero-brush", w: 700, h: 260, seed: 6 },
    { slot: "home-side-1", w: 700, h: 900, seed: 7 },
    { slot: "home-side-2", w: 700, h: 900, seed: 8 },
    { slot: "home-side-3", w: 700, h: 900, seed: 9 },
    { slot: "about-portrait", w: 1000, h: 1200, seed: 3 },
    { slot: "og-share", w: 1200, h: 630, seed: 4 },
  ];
  for (const s of slotImages) {
    const url = placeholder(s.w, s.h, s.seed, s.label);
    await prisma.siteImage.upsert({
      where: { slot: s.slot },
      // Only seed a placeholder when the slot is missing; never overwrite an
      // image the admin has uploaded via the CMS.
      update: {},
      create: {
        slot: s.slot,
        url,
        width: s.w,
        height: s.h,
        altBg: null,
        altEn: null,
      },
    });
  }

  // Content blocks from the registry defaults (don't overwrite admin edits)
  for (const item of CONTENT_REGISTRY) {
    await prisma.contentBlock.upsert({
      where: { key: item.key },
      update: {},
      create: {
        key: item.key,
        valueBg: item.defaultBg,
        valueEn: item.defaultEn,
      },
    });
  }

  // Hero slides
  if ((await prisma.heroSlide.count()) === 0) {
    await prisma.heroSlide.createMany({
      data: [
        {
          eyebrowBg: "Ръчно изработено · Лимитирано",
          eyebrowEn: "Handmade · Limited",
          headlineBg: "Изкуство, направено на ръка",
          headlineEn: "Art made by hand",
          subtextBg: "Ръчно рисувани илюстрации върху неща за всеки ден.",
          subtextEn: "Hand-drawn illustrations on everyday things.",
          imageUrl: placeholder(1600, 900, 11),
          ctaLabelBg: "Към магазина",
          ctaLabelEn: "Shop now",
          ctaHref: "/shop",
          sortOrder: 0,
          active: true,
        },
        {
          eyebrowBg: "Нова колекция",
          eyebrowEn: "New collection",
          headlineBg: "Малки радости за дома",
          headlineEn: "Little joys for your home",
          subtextBg: "Принтове, картички и още.",
          subtextEn: "Prints, postcards and more.",
          imageUrl: placeholder(1600, 900, 12),
          ctaLabelBg: "Разгледай",
          ctaLabelEn: "Explore",
          ctaHref: "/shop",
          sortOrder: 1,
          active: true,
        },
        {
          eyebrowBg: "Намаления",
          eyebrowEn: "On sale",
          headlineBg: "До -20% този месец",
          headlineEn: "Up to -20% this month",
          subtextBg: "Любими модели на специална цена.",
          subtextEn: "Favourites at a special price.",
          imageUrl: placeholder(1600, 900, 13),
          ctaLabelBg: "Виж офертите",
          ctaLabelEn: "See offers",
          ctaHref: "/shop",
          sortOrder: 2,
          active: true,
        },
      ],
    });
  } else {
    // Backfill placeholder images for any slides that don't have one yet.
    const slides = await prisma.heroSlide.findMany({
      orderBy: { sortOrder: "asc" },
    });
    for (let i = 0; i < slides.length; i++) {
      if (!slides[i].imageUrl) {
        await prisma.heroSlide.update({
          where: { id: slides[i].id },
          data: { imageUrl: placeholder(1600, 900, 11 + i) },
        });
      }
    }
  }

  // Social links
  if ((await prisma.socialLink.count()) === 0) {
    await prisma.socialLink.createMany({
      data: [
        { platform: "Instagram", url: "https://instagram.com", sortOrder: 0, active: true },
        { platform: "Facebook", url: "https://facebook.com", sortOrder: 1, active: true },
      ],
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
