import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

async function main() {
  console.log("Seeding database...");

  // Admin user
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
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);

  // Categories
  const categories = [
    { slug: "tshirts", nameBg: "Тениски", nameEn: "T-shirts", image: IMG("photo-1521572163474-6864f9cf17ab") },
    { slug: "cups", nameBg: "Чаши", nameEn: "Cups & Mugs", image: IMG("photo-1514228742587-6b1558fcca3d") },
    { slug: "bags", nameBg: "Торби", nameEn: "Tote bags", image: IMG("photo-1591561954557-26941169b49e") },
    { slug: "baby", nameBg: "Бебешка колекция", nameEn: "Baby collection", image: IMG("photo-1522771930-78848d9293e8") },
    { slug: "gifts", nameBg: "Подаръци", nameEn: "Gifts", image: IMG("photo-1513885535751-8b9238bd345a") },
  ];

  const categoryRecords: Record<string, string> = {};
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const rec = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { nameBg: c.nameBg, nameEn: c.nameEn, image: c.image, sortOrder: i },
      create: { ...c, sortOrder: i },
    });
    categoryRecords[c.slug] = rec.id;
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

  // Products
  const products = [
    {
      slug: "tshirt-opinion", categoryId: categoryRecords.tshirts,
      titleBg: 'Тениска "Мнение"', titleEn: 'T-shirt "Opinion"',
      descriptionBg: "Меко 100% органичен памук с ръчно рисувана илюстрация.",
      descriptionEn: "Soft 100% organic cotton with a hand-drawn illustration.",
      priceCents: 1700, salePercent: null, featured: true, isNew: true,
      image: IMG("photo-1576566588028-4147f3842f27"),
      variants: [
        { size: "S", stock: 8 }, { size: "M", stock: 5 }, { size: "L", stock: 3 }, { size: "XL", stock: 0 },
      ],
    },
    {
      slug: "oversize-tshirt-freedom", categoryId: categoryRecords.tshirts,
      titleBg: 'Оувърсайз тениска "Свобода"', titleEn: 'Oversize t-shirt "Freedom"',
      descriptionBg: "Свободна кройка, перфектна за всеки ден.",
      descriptionEn: "Relaxed oversize fit, perfect for every day.",
      priceCents: 1790, salePercent: 15, featured: true, isNew: false,
      image: IMG("photo-1583743814966-8936f5b7be1a"),
      variants: [{ size: "M", stock: 10 }, { size: "L", stock: 6 }],
    },
    {
      slug: "mug-opinion", categoryId: categoryRecords.cups,
      titleBg: 'Канче "Мнение"', titleEn: 'Mug "Opinion"',
      descriptionBg: "Керамично канче, 330 мл.", descriptionEn: "Ceramic mug, 330 ml.",
      priceCents: 1490, salePercent: null, featured: true, isNew: true,
      image: IMG("photo-1514228742587-6b1558fcca3d"),
      variants: [{ color: "White", stock: 20 }, { color: "Black", stock: 12 }],
    },
    {
      slug: "tote-no-diet", categoryId: categoryRecords.bags,
      titleBg: 'Торба "Няма да отслабвам"', titleEn: 'Tote "No diet"',
      descriptionBg: "Здрава памучна торба за пазар и разходки.",
      descriptionEn: "Sturdy cotton tote for shopping and strolls.",
      priceCents: 1300, salePercent: null, featured: false, isNew: true,
      image: IMG("photo-1591561954557-26941169b49e"),
      variants: [{ stock: 15 }],
    },
    {
      slug: "baby-body-new-day", categoryId: categoryRecords.baby,
      titleBg: 'Бебешко боди "Нов ден"', titleEn: 'Baby bodysuit "New day"',
      descriptionBg: "Меко бебешко боди от органичен памук.",
      descriptionEn: "Soft organic-cotton baby bodysuit.",
      priceCents: 1200, salePercent: null, featured: false, isNew: true,
      image: IMG("photo-1522771930-78848d9293e8"),
      variants: [
        { size: "0-3m", color: "Blue", stock: 6 },
        { size: "3-6m", color: "Pink", stock: 4 },
        { size: "6-9m", color: "Grey", stock: 0 },
      ],
    },
    {
      slug: "gift-set-zodiac", categoryId: categoryRecords.gifts,
      titleBg: "Подаръчен комплект Зодия", titleEn: "Zodiac gift set",
      descriptionBg: "Комплект тениска и чаша с твоята зодия.",
      descriptionEn: "T-shirt and mug set with your zodiac sign.",
      priceCents: 2950, salePercent: 20, featured: true, isNew: false,
      image: IMG("photo-1513885535751-8b9238bd345a"),
      variants: [{ stock: 7 }],
    },
    {
      slug: "hoodie-sexy", categoryId: categoryRecords.tshirts,
      titleBg: 'Суитшърт с качулка "Пак съм си секси"', titleEn: 'Hoodie "Still sexy"',
      descriptionBg: "Топъл суитшърт с вата отвътре.",
      descriptionEn: "Warm fleece-lined hoodie.",
      priceCents: 3528, salePercent: 43, featured: false, isNew: false,
      image: IMG("photo-1556821840-3a63f95609a7"),
      variants: [{ size: "M", stock: 4 }, { size: "L", stock: 2 }],
    },
    {
      slug: "water-bottle", categoryId: categoryRecords.gifts,
      titleBg: 'Бутилка за вода "Простотии"', titleEn: 'Water bottle "Nonsense"',
      descriptionBg: "Многократна бутилка от неръждаема стомана.",
      descriptionEn: "Reusable stainless-steel bottle.",
      priceCents: 1490, salePercent: null, featured: false, isNew: true,
      image: IMG("photo-1602143407151-7111542de6e8"),
      variants: [{ color: "Green", stock: 9 }, { color: "Yellow", stock: 11 }],
    },
  ];

  for (const p of products) {
    const { variants, image, ...rest } = p;
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        ...rest,
        soldCount: Math.floor(Math.random() * 50),
        images: { create: [{ url: image, alt: p.titleEn, sortOrder: 0 }] },
        variants: {
          create: variants.map((v, idx) => ({
            size: "size" in v ? v.size : null,
            color: "color" in v ? v.color : null,
            stock: v.stock,
            sku: `${p.slug}-${idx}`,
            sortOrder: idx,
          })),
        },
      },
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
