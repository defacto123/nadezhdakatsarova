// Pure, client-safe constants and types for the Site Design CMS module.
// NO server-only imports here (no prisma) so client components can import it.

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface ThemeValues {
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
  /** Header brush hue rotation in degrees (0-360). */
  brushHue: number;
  /** Header brush saturation as a percentage (0-200, 100 = original). */
  brushSaturate: number;
  /** Header brush opacity as a percentage (0-100). */
  brushOpacity: number;
  /** Total seconds for one full loop through all hero slides. */
  heroCycleSeconds: number;
}

export const DEFAULT_THEME: ThemeValues = {
  colorBackground: "#fdfcfa",
  colorForeground: "#2c2a28",
  colorMutedText: "#7c756c",
  colorPrimary: "#b76e5b",
  colorPrimaryHover: "#9c5848",
  colorSecondary: "#8a9a86",
  colorSecondaryHover: "#6f7e6b",
  colorAccent: "#e8d3c7",
  colorSurface: "#f4efe9",
  colorBorder: "#ece5db",
  colorSale: "#c4633f",
  radiusRem: 0.6,
  brushHue: 0,
  brushSaturate: 100,
  brushOpacity: 75,
  heroCycleSeconds: 24,
};

// Range for the hero carousel's total cycle-time slider (whole loop, seconds).
export const HERO_CYCLE = { min: 4, max: 60, default: 24 } as const;

export interface ThemeColorField {
  field: keyof ThemeValues;
  label: string;
  help: string;
}

// Editable color fields shown in the theme editor (radius handled separately).
export const THEME_COLOR_FIELDS: ThemeColorField[] = [
  { field: "colorBackground", label: "Background", help: "Main page background" },
  { field: "colorForeground", label: "Text", help: "Primary text colour" },
  { field: "colorMutedText", label: "Muted text", help: "Secondary / subtitle text" },
  { field: "colorPrimary", label: "Primary / brand", help: "Buttons, links, accents" },
  { field: "colorPrimaryHover", label: "Primary hover", help: "Hover state of primary buttons" },
  { field: "colorSecondary", label: "Secondary", help: "Secondary accent (e.g. New badge)" },
  { field: "colorSecondaryHover", label: "Secondary hover", help: "Hover state of secondary" },
  { field: "colorAccent", label: "Accent", help: "Soft accent / highlights" },
  { field: "colorSurface", label: "Surface", help: "Cards, tiles, muted panels" },
  { field: "colorBorder", label: "Borders", help: "Lines and dividers" },
  { field: "colorSale", label: "Sale badge", help: "Discount ribbon colour" },
];

// Maps each theme colour field to the CSS custom properties it overrides.
// Non-colour fields (radius + brush styling) are applied elsewhere.
const THEME_VAR_MAP: Record<
  keyof Omit<
    ThemeValues,
    | "radiusRem"
    | "brushHue"
    | "brushSaturate"
    | "brushOpacity"
    | "heroCycleSeconds"
  >,
  string[]
> = {
  colorBackground: ["--color-cream", "--color-background"],
  colorForeground: ["--color-ink", "--color-foreground"],
  colorMutedText: ["--color-ink-soft", "--color-muted-foreground"],
  colorPrimary: ["--color-clay", "--color-primary"],
  colorPrimaryHover: ["--color-clay-dark"],
  colorSecondary: ["--color-sage"],
  colorSecondaryHover: ["--color-sage-dark"],
  colorAccent: ["--color-blush"],
  colorSurface: ["--color-sand", "--color-muted"],
  colorBorder: ["--color-line", "--color-border"],
  colorSale: ["--color-sale"],
};

/** Build the `:root` CSS variable declarations for a theme. */
export function themeCssVars(theme: ThemeValues): string {
  const lines: string[] = [];
  for (const [field, vars] of Object.entries(THEME_VAR_MAP) as [
    keyof typeof THEME_VAR_MAP,
    string[],
  ][]) {
    const value = theme[field];
    if (!value) continue;
    for (const v of vars) lines.push(`${v}: ${value};`);
  }
  lines.push(`--radius: ${theme.radiusRem}rem;`);
  return lines.join(" ");
}

// ---------------------------------------------------------------------------
// Named image slots (exact dimensions enforced on upload)
// ---------------------------------------------------------------------------

export interface ImageSlot {
  slot: string;
  label: string;
  description: string;
  width: number;
  height: number;
}

export const SITE_IMAGE_SLOTS: ImageSlot[] = [
  {
    slot: "logo",
    label: "Logo",
    description: "Shown in the header. Transparent PNG recommended.",
    width: 480,
    height: 140,
  },
  {
    slot: "header-brush",
    label: "Header brush band",
    description:
      "Optional hand-painted brush band shown behind the header menu. Transparent PNG, full width. Leave empty to use the built-in painted ribbon.",
    width: 1600,
    height: 200,
  },
  {
    slot: "home-side-1",
    label: "Homepage decoration · New arrivals",
    description:
      "Decorative illustration shown next to the “New arrivals” products. Transparent PNG recommended.",
    width: 700,
    height: 900,
  },
  {
    slot: "home-side-2",
    label: "Homepage decoration · Featured",
    description:
      "Decorative illustration shown next to the “Featured” products. Transparent PNG recommended.",
    width: 700,
    height: 900,
  },
  {
    slot: "home-side-3",
    label: "Homepage decoration · On sale",
    description:
      "Decorative illustration shown next to the “On sale” products. Transparent PNG recommended.",
    width: 700,
    height: 900,
  },
  {
    slot: "about-portrait",
    label: "About portrait",
    description: "Portrait photo on the About page.",
    width: 1000,
    height: 1200,
  },
  {
    slot: "og-share",
    label: "Social share image",
    description: "Preview image when the site is shared on social media.",
    width: 1200,
    height: 630,
  },
];

export function imageSlot(slot: string): ImageSlot | undefined {
  return SITE_IMAGE_SLOTS.find((s) => s.slot === slot);
}

// Recommended size for hero carousel slide images. These are full-bleed and
// responsive, so this is a recommendation (not a hard-enforced slot) shown in
// the hero uploader.
export const HERO_IMAGE = { width: 1600, height: 600 } as const;

// Recommended size for the two-image "pair" hero slides. These are transparent
// PNGs (a character/object on each side) that slide in from the edges and meet
// in the centre, so a portrait transparent PNG works best. Shown in the CMS.
export const HERO_PAIR_IMAGE = { width: 700, height: 900 } as const;

// Continuous per-image motion patterns. Shared by the CMS (dropdown) and the
// storefront (CSS class lookup). The on/off switch is a separate "animated"
// boolean, so there is no "none" entry here.
export const HERO_MOTIONS = [
  { value: "float", label: "Float (up & down)" },
  { value: "sway", label: "Sway (left & right)" },
  { value: "pulse", label: "Pulse (gentle zoom)" },
  { value: "rock", label: "Rock (tilt back & forth)" },
  { value: "drift", label: "Drift (diagonal)" },
] as const;

export type HeroMotion = (typeof HERO_MOTIONS)[number]["value"];

// Speed slider bounds (1 = slow, 10 = fast). Mapped to an animation duration
// in the carousel via heroMotionDuration().
export const HERO_SPEED = { min: 1, max: 10, default: 4 } as const;

const HERO_MOTION_CLASS: Record<string, string> = {
  float: "hero-motion-float",
  sway: "hero-motion-sway",
  pulse: "hero-motion-pulse",
  rock: "hero-motion-rock",
  drift: "hero-motion-drift",
};

// Map a 1..10 speed to a CSS animation duration in seconds (slow → fast).
export function heroMotionDuration(speed: number): number {
  const s = Math.min(HERO_SPEED.max, Math.max(HERO_SPEED.min, speed));
  // speed 1 → ~9s, speed 10 → ~1.8s
  return Math.round((9 - (s - 1) * 0.8) * 10) / 10;
}

// The CSS class that drives a given motion, or "" when not animated/unknown.
export function heroMotionClassName(animated: boolean, motion: string): string {
  if (!animated) return "";
  return HERO_MOTION_CLASS[motion] ?? "";
}

// Inline style (duration + optional start delay) to pair with the motion class.
export function heroMotionInlineStyle(
  animated: boolean,
  motion: string,
  speed: number,
  delaySeconds = 0,
): import("react").CSSProperties | undefined {
  if (!animated || !HERO_MOTION_CLASS[motion]) return undefined;
  const style: import("react").CSSProperties = {
    animationDuration: `${heroMotionDuration(speed)}s`,
  };
  if (delaySeconds) style.animationDelay = `${delaySeconds}s`;
  return style;
}

// Recommended size for product images. They are displayed in square frames
// (object-cover), so a 1:1 image avoids cropping. Shown in the product form.
export const PRODUCT_IMAGE = { width: 1200, height: 1200 } as const;

// ---------------------------------------------------------------------------
// Editable static content registry (bilingual)
// ---------------------------------------------------------------------------

export interface ContentRegistryItem {
  key: string;
  group: string;
  label: string;
  help?: string;
  multiline?: boolean;
  defaultBg: string;
  defaultEn: string;
}

export const CONTENT_GROUPS = [
  "Brand",
  "Announcement",
  "Home",
  "About",
  "Newsletter",
  "Footer",
  "Contact",
  "SEO",
] as const;

export const CONTENT_REGISTRY: ContentRegistryItem[] = [
  // Brand
  {
    key: "brand.logoLine1",
    group: "Brand",
    label: "Logo line 1",
    defaultBg: "Надежда",
    defaultEn: "Nadezhda",
  },
  {
    key: "brand.logoLine2",
    group: "Brand",
    label: "Logo line 2",
    defaultBg: "Кацарова · Изкуство",
    defaultEn: "Katsarova · Art",
  },
  {
    key: "brand.tagline",
    group: "Brand",
    label: "Tagline",
    defaultBg: "Ръчно рисувано изкуство върху неща, които ще обикнеш",
    defaultEn: "Hand-drawn art on things you'll love",
  },
  // Announcement
  {
    key: "announcement.text",
    group: "Announcement",
    label: "Announcement bar text",
    help: "Scrolling message at the very top of the site.",
    defaultBg: "Безплатна доставка за поръчки над 80€ · Ръчно изработено с любов",
    defaultEn: "Free shipping on orders over €80 · Handmade with love",
  },
  // Home
  {
    key: "home.artistTitle",
    group: "Home",
    label: "Intro title",
    defaultBg: "Радвам се, че си тук!",
    defaultEn: "Nice you're here!",
  },
  {
    key: "home.artistText",
    group: "Home",
    label: "Intro text",
    multiline: true,
    defaultBg:
      "Аз съм Надежда и рисувам всяка илюстрация, която виждаш тук. Всичко е избрано с любов и опаковано лично. Благодаря, че подкрепяш независимото изкуство!",
    defaultEn:
      "I'm Nadezhda and I draw every illustration you see here. Everything is chosen with love and packed personally. Thank you for supporting independent art!",
  },
  {
    key: "home.shopByCategoryTitle",
    group: "Home",
    label: "“Shop by category” heading",
    defaultBg: "Пазарувай по категория",
    defaultEn: "Shop by category",
  },
  {
    key: "home.newestTitle",
    group: "Home",
    label: "“New arrivals” heading",
    defaultBg: "Нови продукти",
    defaultEn: "New arrivals",
  },
  {
    key: "home.newestSubtitle",
    group: "Home",
    label: "“New arrivals” subtitle",
    defaultBg: "Хей! Виж тук, тези току-що пристигнаха.",
    defaultEn: "Hey! Look here, these just landed.",
  },
  {
    key: "home.trendingTitle",
    group: "Home",
    label: "“Trending” heading",
    defaultBg: "Най-продавани тази седмица",
    defaultEn: "Trending this week",
  },
  {
    key: "home.trendingSubtitle",
    group: "Home",
    label: "“Trending” subtitle",
    defaultBg: "Най-харесваните продукти в момента.",
    defaultEn: "The most-loved pieces right now.",
  },
  {
    key: "home.featuredTitle",
    group: "Home",
    label: "“Featured” heading",
    defaultBg: "Препоръчани",
    defaultEn: "Featured",
  },
  {
    key: "home.discountedTitle",
    group: "Home",
    label: "“On sale” heading",
    defaultBg: "Намалени",
    defaultEn: "On sale",
  },
  {
    key: "home.collectionTitle",
    group: "Home",
    label: "Collection banner title",
    defaultBg: "Любимата колекция",
    defaultEn: "The favourite collection",
  },
  {
    key: "home.collectionCta",
    group: "Home",
    label: "Collection banner button",
    defaultBg: "Към магазина",
    defaultEn: "Shop now",
  },
  {
    key: "home.thanksTitle",
    group: "Home",
    label: "Thank-you section title",
    defaultBg: "Благодаря ти!",
    defaultEn: "Thank you!",
  },
  {
    key: "home.thanksText",
    group: "Home",
    label: "Thank-you section text",
    multiline: true,
    defaultBg:
      "Когато купуваш нещо оттук, ти ме подкрепяш да продължа да рисувам. Всичко е избрано с любов и опаковано лично. Благодаря ти от сърце!",
    defaultEn:
      "When you buy something here, you support me to keep painting. Everything is chosen with love and packed personally. Thank you from my heart!",
  },
  // About
  {
    key: "about.title",
    group: "About",
    label: "About title",
    defaultBg: "Здравей! Аз съм Надежда.",
    defaultEn: "Hello! My name is Nadezhda.",
  },
  {
    key: "about.intro",
    group: "About",
    label: "About intro",
    multiline: true,
    defaultBg:
      "Илюстратор съм и рисувам, откакто се помня. Всяка творба тук е създадена на ръка и с много внимание към детайла.",
    defaultEn:
      "I am an illustrator and I have loved to draw for as long as I can remember. Every piece here is made by hand with great care for detail.",
  },
  {
    key: "about.section1Title",
    group: "About",
    label: "Section 1 title",
    defaultBg: "Моята история",
    defaultEn: "My story",
  },
  {
    key: "about.section1Body",
    group: "About",
    label: "Section 1 body",
    multiline: true,
    defaultBg:
      "Започнах да рисувам с акварел и оттогава не съм спирала. Обичам топлите цветове и истории, които предметите носят.",
    defaultEn:
      "I started painting with watercolours and never stopped. I love warm colours and the little stories objects can carry.",
  },
  {
    key: "about.section2Title",
    group: "About",
    label: "Section 2 title",
    defaultBg: "Как работя",
    defaultEn: "How I work",
  },
  {
    key: "about.section2Body",
    group: "About",
    label: "Section 2 body",
    multiline: true,
    defaultBg:
      "Всеки продукт се печата върху внимателно подбрани материали и се опакова лично от мен.",
    defaultEn:
      "Every product is printed on carefully chosen materials and packed personally by me.",
  },
  // Newsletter
  {
    key: "newsletter.title",
    group: "Newsletter",
    label: "Newsletter title",
    defaultBg: "Абонирай се и вземи 10% отстъпка",
    defaultEn: "Subscribe and get 10% off",
  },
  {
    key: "newsletter.subtitle",
    group: "Newsletter",
    label: "Newsletter subtitle",
    defaultBg: "Бъди първият, който научава за нови продукти и оферти.",
    defaultEn: "Be the first to know about new drops and offers.",
  },
  // Footer
  {
    key: "footer.blurb",
    group: "Footer",
    label: "Footer blurb",
    multiline: true,
    defaultBg: "Независимо ателие за ръчно рисувано изкуство.",
    defaultEn: "Independent studio for hand-drawn art.",
  },
  // Contact
  {
    key: "contact.email",
    group: "Contact",
    label: "Contact email",
    defaultBg: "hello@example.com",
    defaultEn: "hello@example.com",
  },
  {
    key: "contact.phone",
    group: "Contact",
    label: "Contact phone",
    defaultBg: "+359 00 000 0000",
    defaultEn: "+359 00 000 0000",
  },
  {
    key: "contact.address",
    group: "Contact",
    label: "Contact address",
    multiline: true,
    defaultBg: "София, България",
    defaultEn: "Sofia, Bulgaria",
  },
  // SEO
  {
    key: "seo.title",
    group: "SEO",
    label: "Default page title",
    defaultBg: "Надежда Кацарова — Арт бутик",
    defaultEn: "Nadezhda Katsarova — Art Boutique",
  },
  {
    key: "seo.description",
    group: "SEO",
    label: "Default meta description",
    multiline: true,
    defaultBg:
      "Ръчно рисувано изкуство върху тениски, чаши, торби и още. Независими илюстрации, направени с любов.",
    defaultEn:
      "Hand-drawn art on t-shirts, mugs, totes and more. Independent illustrations, made with love.",
  },
];

const REGISTRY_BY_KEY = new Map(CONTENT_REGISTRY.map((i) => [i.key, i]));

/** Localized default for a content key (used as fallback when no DB row). */
export function contentDefault(key: string, locale: string): string {
  const item = REGISTRY_BY_KEY.get(key);
  if (!item) return "";
  return locale === "en" ? item.defaultEn : item.defaultBg;
}

export type ContentMap = Record<string, { valueBg: string; valueEn: string }>;

/** Resolve a content value: DB row first, then registry default. */
export function contentValue(
  map: ContentMap,
  key: string,
  locale: string,
): string {
  const row = map[key];
  if (row) {
    const v = locale === "en" ? row.valueEn : row.valueBg;
    if (v) return v;
  }
  return contentDefault(key, locale);
}
