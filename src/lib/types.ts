export interface CardImage {
  url: string;
  alt: string | null;
}

export interface CardProduct {
  id: string;
  slug: string;
  titleBg: string;
  titleEn: string;
  categorySlug: string;
  categoryNameBg: string;
  categoryNameEn: string;
  priceCents: number;
  salePercent: number | null;
  isNew: boolean;
  images: CardImage[];
  sizes: string[];
  totalStock: number;
  hasVariants: boolean;
}
