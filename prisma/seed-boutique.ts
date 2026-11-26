/**
 * Demo data for boutique mode: 6 placeholder items in the hidden "boutique"
 * category, flagged inBoutique. Idempotent (upsert by slug). Local/demo only:
 *   npx tsx prisma/seed-boutique.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

const ITEMS = [
  {
    slug: "demo-boutique-blue-vase",
    titleBg: "Синя ваза „Утро край морето“",
    titleEn: "“Morning by the Sea” blue vase",
    descriptionBg:
      "Ръчно изрисувана керамична ваза в нюанси на кобалт и тюркоаз. Всяка линия е положена с четка, без шаблон — затова няма две еднакви. Подходяща за сухи цветя или просто като акцент на рафта. Височина 24 см.",
    descriptionEn:
      "Hand-painted ceramic vase in shades of cobalt and turquoise. Every line is laid down by brush, without a stencil — so no two are alike. Lovely with dried flowers or simply as an accent on a shelf. Height 24 cm.",
    priceCents: 6800,
    images: ["photo-1513885535751-8b9238bd345a", "photo-1499951360447-b19be8fe80f5"],
  },
  {
    slug: "demo-boutique-watercolor-garden",
    titleBg: "Акварел „Градината на баба“",
    titleEn: "Watercolour “Grandmother’s Garden”",
    descriptionBg:
      "Оригинален акварел върху памучна хартия 300 g/m², 30×40 см. Рисуван през лятото на живо в градината — с божури, мента и стар дървен стол. Доставя се с паспарту, готов за рамкиране.",
    descriptionEn:
      "Original watercolour on 300 g/m² cotton paper, 30×40 cm. Painted from life in the garden one summer — peonies, mint and an old wooden chair. Comes mounted, ready to frame.",
    priceCents: 14500,
    salePercent: 15,
    images: ["photo-1500673922987-e212871fec22", "photo-1467003909585-2f8a72700288"],
  },
  {
    slug: "demo-boutique-linen-tote",
    titleBg: "Ленена чанта с ръчна рисунка",
    titleEn: "Hand-painted linen tote",
    descriptionBg:
      "Здрава ленена чанта с рисунка от текстилни бои, фиксирана с топлина — пере се на 30°. Предлага се в два размера.",
    descriptionEn:
      "Sturdy linen tote painted with heat-set textile paint — washable at 30°. Available in two sizes.",
    priceCents: 3900,
    images: ["photo-1591561954557-26941169b49e"],
    variants: [
      { size: "M", stock: 3 },
      { size: "L", stock: 2, priceOverrideCents: 4500 },
    ],
  },
  {
    slug: "demo-boutique-tshirt-lavender",
    titleBg: "Тениска „Лавандула“",
    titleEn: "“Lavender” T-shirt",
    descriptionBg:
      "Памучна тениска с ръчно рисувана клонка лавандула на гърдите. Всяка е рисувана поотделно, затова оттенъкът леко се различава.",
    descriptionEn:
      "Cotton T-shirt with a hand-painted sprig of lavender on the chest. Each one is painted separately, so the shade varies slightly.",
    priceCents: 4200,
    images: ["photo-1521572163474-6864f9cf17ab"],
    variants: [
      { size: "S", stock: 1 },
      { size: "M", stock: 2 },
      { size: "L", stock: 0 },
    ],
  },
  {
    slug: "demo-boutique-hoodie-forest",
    titleBg: "Суитшърт „Гора“",
    titleEn: "“Forest” hoodie",
    descriptionBg:
      "Мек суитшърт с рисувани борове в зелено и охра. Единствен екземпляр — размер M.",
    descriptionEn:
      "Soft hoodie with painted pines in green and ochre. A single piece — size M.",
    priceCents: 7900,
    images: ["photo-1556821840-3a63f95609a7"],
    variants: [{ size: "M", stock: 1 }],
  },
  {
    slug: "demo-boutique-mini-prints",
    titleBg: "Комплект мини принтове „Сезони“",
    titleEn: "“Seasons” mini print set",
    descriptionBg:
      "Четири малки принта (13×18 см) — пролет, лято, есен и зима, отпечатани на матова художествена хартия и подписани на гърба.",
    descriptionEn:
      "Four small prints (13×18 cm) — spring, summer, autumn and winter — printed on matte fine-art paper and signed on the back.",
    priceCents: 3200,
    images: ["photo-1499951360447-b19be8fe80f5", "photo-1513885535751-8b9238bd345a"],
  },
] as const;

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "boutique" },
    update: {},
    create: { slug: "boutique", nameBg: "Бутик", nameEn: "Boutique", active: false, sortOrder: 999 },
  });

  for (const [i, item] of ITEMS.entries()) {
    const data = {
      titleBg: item.titleBg,
      titleEn: item.titleEn,
      descriptionBg: item.descriptionBg,
      descriptionEn: item.descriptionEn,
      priceCents: item.priceCents,
      salePercent: "salePercent" in item ? item.salePercent : null,
      isNew: i < 2,
      active: true,
      inBoutique: true,
      boutiqueSortOrder: i,
      categoryId: category.id,
      // Spread dates so the feed shows a believable "posted on" timeline.
      createdAt: new Date(Date.now() - i * 9 * 24 * 3600 * 1000),
    };
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data },
    });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: item.images.map((id, sortOrder) => ({
        productId: product.id,
        url: IMG(id),
        alt: item.titleEn,
        sortOrder,
      })),
    });
    if ("variants" in item) {
      await prisma.productVariant.createMany({
        data: item.variants.map((v, sortOrder) => ({
          productId: product.id,
          size: v.size,
          stock: v.stock,
          priceOverrideCents: "priceOverrideCents" in v ? v.priceOverrideCents : null,
          sortOrder,
        })),
      });
    }
  }
  console.log(`Seeded ${ITEMS.length} boutique demo items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
