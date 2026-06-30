"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendCampaign } from "@/lib/marketing";
import { CACHE_TAGS } from "@/lib/site-settings";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export interface VariantInput {
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
  priceOverrideCents: number | null;
}

export interface ProductInput {
  id?: string;
  slug: string;
  titleBg: string;
  titleEn: string;
  descriptionBg: string | null;
  descriptionEn: string | null;
  priceCents: number;
  salePercent: number | null;
  featured: boolean;
  isNew: boolean;
  active: boolean;
  categoryId: string;
  images: { url: string; alt: string | null }[];
  variants: VariantInput[];
}

export async function saveProduct(input: ProductInput) {
  await assertAdmin();

  const data = {
    slug: input.slug,
    titleBg: input.titleBg,
    titleEn: input.titleEn,
    descriptionBg: input.descriptionBg,
    descriptionEn: input.descriptionEn,
    priceCents: input.priceCents,
    salePercent: input.salePercent,
    featured: input.featured,
    isNew: input.isNew,
    active: input.active,
    categoryId: input.categoryId,
  };

  let productId = input.id;
  if (productId) {
    await prisma.product.update({ where: { id: productId }, data });
    await prisma.productImage.deleteMany({ where: { productId } });
    await prisma.productVariant.deleteMany({ where: { productId } });
  } else {
    const created = await prisma.product.create({ data });
    productId = created.id;
  }

  if (input.images.length > 0) {
    await prisma.productImage.createMany({
      data: input.images.map((img, i) => ({
        productId: productId!,
        url: img.url,
        alt: img.alt,
        sortOrder: i,
      })),
    });
  }
  if (input.variants.length > 0) {
    await prisma.productVariant.createMany({
      data: input.variants.map((v, i) => ({
        productId: productId!,
        size: v.size,
        color: v.color,
        sku: v.sku || null,
        stock: v.stock,
        priceOverrideCents: v.priceOverrideCents,
        sortOrder: i,
      })),
    });
  }

  revalidatePath("/admin/products");
  return { id: productId };
}

export async function deleteProduct(id: string) {
  await assertAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
}

export interface CategoryInput {
  id?: string;
  slug: string;
  nameBg: string;
  nameEn: string;
  descriptionBg: string | null;
  descriptionEn: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  active: boolean;
}

export async function saveCategory(input: CategoryInput) {
  await assertAdmin();
  const { id, ...data } = input;
  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({ data });
  }
  revalidatePath("/admin/categories");
  revalidateTag(CACHE_TAGS.categories, { expire: 0 });
  revalidatePath("/", "layout");
}

export async function deleteCategory(id: string) {
  await assertAdmin();
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error("Category has products; move or delete them first.");
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidateTag(CACHE_TAGS.categories, { expire: 0 });
  revalidatePath("/", "layout");
}

export interface DiscountInput {
  id?: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderCents: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  expiresAt: string | null;
  active: boolean;
}

export async function saveDiscount(input: DiscountInput) {
  await assertAdmin();
  const { id, expiresAt, ...rest } = input;
  const data = {
    ...rest,
    code: rest.code.trim().toUpperCase(),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  };
  if (id) {
    await prisma.discountCode.update({ where: { id }, data });
  } else {
    await prisma.discountCode.create({ data });
  }
  revalidatePath("/admin/discounts");
}

export async function deleteDiscount(id: string) {
  await assertAdmin();
  await prisma.discountCode.delete({ where: { id } });
  revalidatePath("/admin/discounts");
}

export async function updateOrderStatus(
  id: string,
  status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED",
) {
  await assertAdmin();
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export interface ShippingZoneInput {
  id?: string;
  name: string;
  countries: string[];
  sortOrder: number;
}

export async function saveShippingZone(input: ShippingZoneInput) {
  await assertAdmin();
  const { id, ...data } = input;
  if (id) {
    await prisma.shippingZone.update({ where: { id }, data });
  } else {
    await prisma.shippingZone.create({ data });
  }
  revalidatePath("/admin/shipping");
}

export async function deleteShippingZone(id: string) {
  await assertAdmin();
  await prisma.shippingZone.delete({ where: { id } });
  revalidatePath("/admin/shipping");
}

export interface ShippingRateInput {
  id?: string;
  zoneId: string;
  name: string;
  priceCents: number;
  freeOverCents: number | null;
  sortOrder: number;
}

export async function saveShippingRate(input: ShippingRateInput) {
  await assertAdmin();
  const { id, ...data } = input;
  if (id) {
    await prisma.shippingRate.update({ where: { id }, data });
  } else {
    await prisma.shippingRate.create({ data });
  }
  revalidatePath("/admin/shipping");
}

export async function deleteShippingRate(id: string) {
  await assertAdmin();
  await prisma.shippingRate.delete({ where: { id } });
  revalidatePath("/admin/shipping");
}

export interface CampaignInput {
  id?: string;
  subject: string;
  preheader: string | null;
  bodyHtml: string;
}

export async function saveCampaign(input: CampaignInput) {
  await assertAdmin();
  const { id, ...data } = input;
  if (id) {
    await prisma.campaign.update({ where: { id }, data });
    revalidatePath("/admin/campaigns");
    return { id };
  }
  const created = await prisma.campaign.create({ data });
  revalidatePath("/admin/campaigns");
  return { id: created.id };
}

export async function sendCampaignNow(id: string) {
  await assertAdmin();
  const result = await sendCampaign(id);
  revalidatePath("/admin/campaigns");
  return result;
}

// ---------------------------------------------------------------------------
// Site Design
// ---------------------------------------------------------------------------

/**
 * Revalidate the whole storefront after a site-design change. Busts both the
 * full-route layout cache and the tagged data caches for the CMS-managed data
 * read by the shared layout, so edits are reflected on the next request.
 */
function revalidateSite() {
  revalidatePath("/", "layout");
  // expire: 0 -> invalidate immediately (read-your-own-writes) in Next 16.
  revalidateTag(CACHE_TAGS.content, { expire: 0 });
  revalidateTag(CACHE_TAGS.images, { expire: 0 });
  revalidateTag(CACHE_TAGS.socials, { expire: 0 });
  revalidateTag(CACHE_TAGS.theme, { expire: 0 });
}

export interface SiteThemeInput {
  colorBackground: string;
  colorForeground: string;
  colorMutedText: string;
  colorPrimary: string;
  colorPrimaryHover: string;
  colorSecondary: string;
  colorSecondaryHover: string;
  colorAccent: string;
  colorSurface: string;
  colorBorder: string;
  colorSale: string;
  radiusRem: number;
  brushHue: number;
  brushSaturate: number;
  brushOpacity: number;
  bodyFontId: string | null;
  headingFontId: string | null;
}

export async function saveSiteTheme(input: SiteThemeInput) {
  await assertAdmin();
  await prisma.siteTheme.upsert({
    where: { id: "default" },
    update: input,
    create: { id: "default", ...input },
  });
  revalidatePath("/admin/site-design/theme");
  revalidateSite();
}

export interface ContentBlockInput {
  key: string;
  valueBg: string;
  valueEn: string;
}

export async function saveContentBlocks(blocks: ContentBlockInput[]) {
  await assertAdmin();
  for (const b of blocks) {
    await prisma.contentBlock.upsert({
      where: { key: b.key },
      update: { valueBg: b.valueBg, valueEn: b.valueEn },
      create: { key: b.key, valueBg: b.valueBg, valueEn: b.valueEn },
    });
  }
  revalidatePath("/admin/site-design/content");
  revalidateSite();
}

export interface SiteImageInput {
  slot: string;
  url: string;
  altBg: string | null;
  altEn: string | null;
  width: number;
  height: number;
  animated: boolean;
  motion: string; // float|sway|pulse|rock|drift
  speed: number; // 1 (slow) .. 10 (fast)
  bgColor: string | null; // background behind the image; null = transparent
}

export async function saveSiteImage(input: SiteImageInput) {
  await assertAdmin();
  const { slot, ...rest } = input;
  await prisma.siteImage.upsert({
    where: { slot },
    update: rest,
    create: { slot, ...rest },
  });
  revalidatePath("/admin/site-design/images");
  revalidateSite();
}

export async function deleteSiteImage(slot: string) {
  await assertAdmin();
  await prisma.siteImage.deleteMany({ where: { slot } });
  revalidatePath("/admin/site-design/images");
  revalidateSite();
}

export interface FontAssetInput {
  label: string;
  family: string;
  url: string;
  format: string;
}

export async function saveFontAsset(input: FontAssetInput) {
  await assertAdmin();
  const created = await prisma.fontAsset.create({ data: input });
  revalidatePath("/admin/site-design/fonts");
  return { id: created.id };
}

export async function deleteFontAsset(id: string) {
  await assertAdmin();
  await prisma.fontAsset.delete({ where: { id } });
  revalidatePath("/admin/site-design/fonts");
  revalidateSite();
}

export async function setActiveFont(
  role: "body" | "heading",
  fontId: string | null,
) {
  await assertAdmin();
  const data =
    role === "body" ? { bodyFontId: fontId } : { headingFontId: fontId };
  await prisma.siteTheme.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  revalidatePath("/admin/site-design/fonts");
  revalidateSite();
}

export interface HeroSlideInput {
  id?: string;
  kind: string; // "single" | "pair"
  imageUrl: string | null; // single image, or left-edge image of a pair
  imageUrl2: string | null; // right-edge image (pair only)
  href: string | null; // redirect URL for the slide
  // Continuous motion per image (image 1 = single/left, image 2 = right).
  motion1: string; // float|sway|pulse|rock|drift
  speed1: number; // 1 (slow) .. 10 (fast)
  animated1: boolean; // motion on/off for image 1
  motion2: string;
  speed2: number;
  animated2: boolean; // motion on/off for image 2
  bgColor: string | null; // band background colour; null = transparent
  sortOrder: number;
  active: boolean;
}

export async function saveHeroSlide(input: HeroSlideInput) {
  await assertAdmin();
  const { id, ...data } = input;
  if (id) {
    await prisma.heroSlide.update({ where: { id }, data });
  } else {
    await prisma.heroSlide.create({ data });
  }
  revalidatePath("/admin/site-design/hero");
  revalidateSite();
}

export async function deleteHeroSlide(id: string) {
  await assertAdmin();
  await prisma.heroSlide.delete({ where: { id } });
  revalidatePath("/admin/site-design/hero");
  revalidateSite();
}

export interface SocialLinkInput {
  id?: string;
  platform: string;
  url: string;
  sortOrder: number;
  active: boolean;
}

export async function saveSocialLink(input: SocialLinkInput) {
  await assertAdmin();
  const { id, ...data } = input;
  if (id) {
    await prisma.socialLink.update({ where: { id }, data });
  } else {
    await prisma.socialLink.create({ data });
  }
  revalidatePath("/admin/site-design/social");
  revalidateSite();
}

export async function deleteSocialLink(id: string) {
  await assertAdmin();
  await prisma.socialLink.delete({ where: { id } });
  revalidatePath("/admin/site-design/social");
  revalidateSite();
}
