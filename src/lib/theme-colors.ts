export type BrandColorKey =
  | "primaryColor"
  | "secondaryColor"
  | "accentColor"
  | "backgroundColor"
  | "announcementColor";

export type BrandColor = {
  key: BrandColorKey;
  label: string;
  default: string;
  description: string;
  usedFor: string[];
  drives: string[];
};

/**
 * The four brand colours that theme the whole storefront. Editing one updates
 * every element that uses it (see `drives` for the underlying CSS variables).
 */
export const BRAND_COLORS: BrandColor[] = [
  {
    key: "primaryColor",
    label: "Primary colour",
    default: "#6C2D5C",
    description:
      "The main accent customers see most. It highlights prices, links, active states and accents throughout the store.",
    usedFor: [
      "Product prices",
      "Links and hover states",
      "Sale badges",
      "Wishlist heart",
      "Input focus rings",
      "Small 'eyebrow' labels",
    ],
    drives: ["--color-rose-500", "--color-rose-600", "--color-rose-400", "--color-rose-700", "--color-soft-sage", "--color-zed-600"],
  },
  {
    key: "secondaryColor",
    label: "Secondary colour",
    default: "#263746",
    description:
      "The deep brand colour. It anchors the header, footer and primary buttons for a premium, grounded look.",
    usedFor: [
      "Footer background",
      "Primary buttons (for example Add to cart)",
      "Admin header and buttons",
      "Headings on dark panels",
    ],
    drives: ["--color-plum-800", "--color-plum-900", "--color-plum-700", "--color-plum-950", "--color-deep-olive", "--color-zed-950", "--color-zed-900", "--color-zed-800", "--color-zed-700"],
  },
  {
    key: "accentColor",
    label: "Accent colour",
    default: "#7C3AED",
    description:
      "A secondary highlight used sparingly for promotional accents, gradient text and decorative details.",
    usedFor: [
      "Gradient headline text",
      "Promotional highlights",
      "Decorative accents and badges",
    ],
    drives: ["--color-violet-500", "--color-violet-600", "--color-violet-700", "--color-champagne"],
  },
  {
    key: "backgroundColor",
    label: "Background colour",
    default: "#F3F0EA",
    description:
      "The page canvas behind all content. It is also used for cards and white surfaces, so keep it light for readable text.",
    usedFor: [
      "Page background",
      "Card surfaces",
      "Panels and form backgrounds",
    ],
    drives: ["--color-pure-white", "--color-warm-white", "--color-warm-ivory"],
  },
  {
    key: "announcementColor",
    label: "Announcement bar colour",
    default: "#6C2D5C",
    description:
      "The background of the scrolling announcement bar at the top of every page. It changes only this bar - nothing else on the store is affected.",
    usedFor: ["Top announcement bar", "Mobile information bar"],
    drives: ["--color-announcement"],
  },
];

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

export const BRAND_COLOR_DEFAULTS: Record<BrandColorKey, string> = BRAND_COLORS.reduce(
  (acc, color) => {
    acc[color.key] = color.default;
    return acc;
  },
  {} as Record<BrandColorKey, string>,
);
