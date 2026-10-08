import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  COLLECTION_PHOTO,
  OCCASION_PHOTO,
  PRODUCT_PHOTO,
  RECIPIENT_PHOTO,
  photoUrl,
} from "../scripts/demo-images";
import { RIO_CATEGORIES, RIO_PRODUCTS } from "./rio-catalogue";

const prisma = new PrismaClient();

function placeholder(name: string, alt: string) {
 // Products and blog posts are both keyed by slug, so fall back only when a
// product has no mapped photo of its own.
const url = PRODUCT_PHOTO[name]
  ? photoUrl(PRODUCT_PHOTO[name])
  : `/placeholders/${name}.svg`;
 return { url, alt, sortOrder: 0, isPrimary: true };
}

function categoryImage(slug: string, kind: "CATEGORY" | "OCCASION" | "RECIPIENT") {
 if (kind === "CATEGORY") return `/placeholders/category-${slug}.svg`;
 const photoKey = kind === "OCCASION" ? OCCASION_PHOTO[slug] : RECIPIENT_PHOTO[slug];
 return photoKey ? photoUrl(photoKey) : `/placeholders/${kind === "OCCASION" ? "occasion" : "recipient"}-${slug}.svg`;
}

const KES = (n: number) => n;

async function upsertUser(data: {
 email: string;
 name: string;
 password: string;
 role: "CUSTOMER" | "STAFF" | "ADMIN";
 phone?: string;
}) {
 const passwordHash = await bcrypt.hash(data.password, 12);
 return prisma.user.upsert({
 where: { email: data.email },
 update: { role: data.role, name: data.name },
 create: {
 email: data.email,
 name: data.name,
 phone: data.phone,
 role: data.role,
 emailVerified: new Date(),
 passwordHash,
 },
 });
}

async function upsertCategory(slug: string, name: string, kind: "CATEGORY" | "OCCASION" | "RECIPIENT", description?: string) {
 return prisma.category.upsert({
 where: { slug },
 update: { name, active: true },
 create: {
 slug,
 name,
 kind,
 description,
 active: true,
 image: categoryImage(slug, kind),
 },
 });
}

async function upsertChildCategory(slug: string, name: string, parentId: string, sortOrder: number) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, parentId, active: true, kind: "CATEGORY" },
    create: {
      slug,
      name,
      kind: "CATEGORY",
      parentId,
      sortOrder,
      active: true,
      image: `/placeholders/category-${slug}.svg`,
    },
  });
}

const missingCategoryRefs = new Map<string, Set<string>>();

async function linkCategories(productId: string, slugs: string[], productSlug: string) {
 for (const slug of slugs) {
 const category = await prisma.category.findUnique({ where: { slug } });
 if (!category) {
 const refs = missingCategoryRefs.get(slug) ?? new Set<string>();
 refs.add(productSlug);
 missingCategoryRefs.set(slug, refs);
 continue;
 }
 await prisma.productCategory.upsert({
 where: { productId_categoryId: { productId, categoryId: category.id } },
 update: {},
 create: { productId, categoryId: category.id },
 });
 }
}

async function upsertCollection(slug: string, name: string, description?: string, featured = false) {
 return prisma.collection.upsert({
 where: { slug },
 update: { name, featured },
 create: { slug, name, description, featured, image: COLLECTION_PHOTO[slug] ? photoUrl(COLLECTION_PHOTO[slug]) : `/placeholders/collection-${slug}.svg` },
 });
}

async function linkCollections(productId: string, slugs: string[]) {
 for (const slug of slugs) {
 const collection = await prisma.collection.findUnique({ where: { slug } });
 if (!collection) continue;
 await prisma.productCollection.upsert({
 where: { productId_collectionId: { productId, collectionId: collection.id } },
 update: {},
 create: { productId, collectionId: collection.id },
 });
 }
}

type SeedProduct = {
 slug: string;
 name: string;
 headline?: string;
 shortDescription?: string;
 description?: string;
 price: number;
 compareAtPrice?: number;
 sku?: string;
 tags: string[];
 quantity: number;
 personalizationEnabled?: boolean;
 giftWrapAvailable?: boolean;
 featured?: boolean;
 bestSeller?: boolean;
 categories: string[];
 collections?: string[];
 variants?: { name: string; value: string; priceOffset?: number; quantity?: number }[];
 image: string;
 deliveryNote?: string;
};

const TEST_PRODUCT: SeedProduct = {
  slug: "mpesa-stk-test-1-kes",
  name: "M-PESA STK Test Product",
  headline: "KES 1 payment test",
  shortDescription: "Temporary product for testing the M-PESA STK Push.",
  description: "Use this product only to test the Zed Gift Shop 2 M-PESA STK Push flow.",
  price: 1,
  sku: "ZED2-STK-TEST-1",
  tags: ["test", "mpesa", "stk"],
  quantity: 999,
  categories: ["corporate"],
  collections: ["new-arrivals"],
  featured: false,
  bestSeller: false,
  personalizationEnabled: false,
  giftWrapAvailable: false,
  image: "mpesa-stk-test",
  deliveryNote: "TEST PRODUCT — do not use for real orders.",
};

const PRODUCTS: SeedProduct[] = RIO_PRODUCTS.map((item) => ({
  slug: item.slug,
  name: item.name,
  shortDescription: item.shortDescription,
  description: item.description,
  price: KES(item.price),
  compareAtPrice: item.compareAtPrice ? KES(item.compareAtPrice) : undefined,
  sku: `ZED2-${item.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 24)}`,
  tags: item.tags ?? [],
  quantity: item.quantity ?? 60,
  categories: item.categories,
  collections: [item.bestSeller ? "bestsellers" : "new-arrivals"],
  featured: item.featured ?? false,
  bestSeller: item.bestSeller ?? false,
  personalizationEnabled: item.personalizationEnabled ?? false,
  giftWrapAvailable: item.giftWrapAvailable ?? true,
  image: item.slug,
}));

async function main() {
 // ---- Users ----
 await upsertUser({
 email: "admin@zedgiftshop2.com",
 name: "ZED 2 Admin",
 password: "Admin@12345",
 role: "ADMIN",
 phone: "+254711436169",
 });
 await upsertUser({
 email: "staff@zedgiftshop2.com",
 name: "ZED 2 Staff",
 password: "Staff@12345",
 role: "STAFF",
 phone: "+254711436169",
 });
 const demo = await upsertUser({
 email: "demo@zedgiftshop2.com",
 name: "Demo Customer",
 password: "Demo@12345",
 role: "CUSTOMER",
 phone: "+254712345678",
 });

 // ---- Categories ----
 const occasionSlugs = [
 ["birthday", "Birthday", "Birthday gifts that arrive fast and personal."],
 ["anniversary", "Anniversary", "Milestone-worthy gifts for your person."],
 ["graduation", "Graduation", "Celebrate the next chapter in style."],
 ["corporate", "Corporate Gifts", "Client, staff and onboarding gifts at scale."],
 ["valentines", "Valentine's Day", "Romantic gifts that say more."],
 ["fathers-day", "Father's Day", "Gifts for the man who raised you."],
 ["wedding", "Wedding", "Wedding, bridal and couple gifts."],
 ["just-because", "Just Because", "Zero occasion required."],
 ] as const;
 const recipientSlugs = [
 ["for-him", "Gifts for Him"],
 ["for-her", "Gifts for Her"],
 ["for-couples", "Gifts for Couples"],
 ["for-friends", "For Friends"],
 ["for-parents", "For Parents"],
 ["for-colleagues", "For Colleagues"],
 ] as const;

 for (const [slug, name, description] of occasionSlugs) {
 await upsertCategory(slug, name, "OCCASION", description);
 }
  for (const [slug, name] of recipientSlugs) {
    await upsertCategory(slug, name, "RECIPIENT");
  }

  // ---- Storefront category tree (mirrors the source site) ----
  for (const [index, parent] of RIO_CATEGORIES.entries()) {
    const parentRow = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name, kind: "CATEGORY", active: true, parentId: null, sortOrder: index },
      create: {
        slug: parent.slug,
        name: parent.name,
        kind: "CATEGORY",
        sortOrder: index,
        active: true,
        image: `/placeholders/category-${parent.slug}.svg`,
        seoTitle: `${parent.name} in Kenya | ${"ZED Gift Shop 2"}`,
        seoDescription: `Shop ${parent.name.toLowerCase()} online in Kenya. Personalized and branded options, same-day delivery in Nairobi and next-day delivery countrywide.`,
      },
    });

    if (!parent.children?.length) continue;
    for (const [childIndex, child] of parent.children.entries()) {
      await upsertChildCategory(child.slug, child.name, parentRow.id, childIndex);
    }
  }

 // ---- Collections ----
 await upsertCollection("bestsellers", "Bestsellers", "The gifts customers keep coming back for.", true);
 await upsertCollection("new-arrivals", "New Arrivals", "Fresh on the shelf this week.", true);
 await upsertCollection("corporate", "Corporate Gifts", "Curated for teams, clients and events.");
 await upsertCollection("personalized-picks", "Personalized Picks", "Made extra special with a name or message.");
 await upsertCollection("home-and-living", "Home & Living", "Objects that make a space feel like them.");
 await upsertCollection("gourmet", "Gourmet", "Eat, drink and celebrate.");
 await upsertCollection("customer-service-week", "Customer Service Week", "Limited-time gifts and staff appreciation offers.", true);

 // ---- Products ----
  // Stagger publishedAt so "New Arrivals" ordering is stable and meaningful:
  // the first catalogue entry is the newest, each later entry one day older.
  const NEWEST = Date.UTC(2026, 8, 29, 9, 0, 0);
  const DAY = 24 * 60 * 60 * 1000;

  for (const [index, p] of allProducts.entries()) {
  const publishedAt = new Date(NEWEST - index * DAY);
 const product = await prisma.product.upsert({
 where: { slug: p.slug },
 update: {
 name: p.name,
 headline: p.headline,
 shortDescription: p.shortDescription,
 description: p.description,
 price: p.price,
 compareAtPrice: p.compareAtPrice,
 sku: p.sku,
 tags: p.tags,
 status: "ACTIVE",
 featured: p.featured ?? false,
 bestSeller: p.bestSeller ?? false,
 publishedAt: publishedAt,
 quantity: p.quantity,
 trackInventory: true,
 personalizationEnabled: p.personalizationEnabled ?? false,
 personalizationFieldsJson: p.personalizationEnabled
 ? JSON.stringify([
 p.slug.includes("mug") ? { key: "name", label: "Name to print", type: "text", required: true } : { key: "initials", label: "Initials / name", type: "text", required: true },
 ])
 : null,
giftWrapAvailable: p.giftWrapAvailable ?? false,
  giftMessageAvailable: true,
  deliveryNote: p.deliveryNote,
  // Replace images so re-seeding after a photo-map change actually applies it.
  images: {
    deleteMany: {},
    create: [placeholder(p.image, p.name)],
  },
  },
 create: {
 slug: p.slug,
 name: p.name,
 headline: p.headline,
 shortDescription: p.shortDescription,
 description: p.description,
 price: p.price,
 compareAtPrice: p.compareAtPrice,
 sku: p.sku,
 tags: p.tags,
 status: "ACTIVE",
 featured: p.featured ?? false,
 bestSeller: p.bestSeller ?? false,
 publishedAt: publishedAt,
 quantity: p.quantity,
 trackInventory: true,
 personalizationEnabled: p.personalizationEnabled ?? false,
 personalizationFieldsJson: p.personalizationEnabled
 ? JSON.stringify([
 { key: "name", label: "Engraving text", type: "text", required: true, maxLength: 24 },
 ])
 : null,
 giftWrapAvailable: p.giftWrapAvailable ?? false,
 giftMessageAvailable: true,
 deliveryNote: p.deliveryNote,
 images: { create: [placeholder(p.image, p.name)] },
 variants: p.variants
 ? {
 create: p.variants.map((v, i) => ({
 name: v.name,
 value: v.value,
 sku: `${p.sku}-${String(i + 1).padStart(2, "0")}`,
 priceOffset: v.priceOffset ?? 0,
 quantity: v.quantity ?? p.quantity,
 active: true,
 })),
 }
 : undefined,
 },
 });

    await linkCategories(product.id, p.categories, p.slug);
 const collections = p.variants?.some((v) => v.name === "Colour")
 ? [...(p.collections ?? [])]
 : [...(p.collections ?? [])];
 await linkCollections(product.id, collections.length ? collections : ["new-arrivals"]);
  }

  // ---- Customer Service Week flash sale ----
  const customerServiceWeekSlugs = [
    "high-end-corporate-gift-hampers",
    "company-branded-merchandise",
    "personalized-business-gift-sets",
    "custom-logo-jute-tote-bags",
    "multi-colour-diary-2027",
    "2027-diaries-personalized-by-rio-gift-shop",
  ];
  for (const slug of customerServiceWeekSlugs) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true, tags: true } });
    if (!product) continue;
    const tags = Array.from(new Set([...product.tags, "flash-sale", "customer-service-week"]));
    await prisma.product.update({ where: { id: product.id }, data: { tags } });
    await linkCollections(product.id, ["customer-service-week"]);
  }

  if (missingCategoryRefs.size > 0) {
    console.warn(
      `Warning: ${missingCategoryRefs.size} catalogue category reference(s) did not match a seeded category:`,
    );
    for (const [slug, products] of missingCategoryRefs) {
      console.warn(`  - ${slug} (used by: ${[...products].join(", ")})`);
    }
  }

// ---- Delivery zones ----
  const zones: {
  name: string;
  county: string;
  town?: string | null;
  fee: number;
  expressFee?: number;
  deliveryTime?: string;
  sameDay?: boolean;
  pickup?: boolean;
  codAvailable?: boolean;
  minOrder?: number;
  maxOrder?: number;
  deliveryPartner?: string;
  }[] = [
  { name: "Nairobi County", county: "Nairobi", fee: 150, expressFee: 300, deliveryTime: "1-3 business days", sameDay: true, pickup: true, codAvailable: true, minOrder: 500, maxOrder: 300000, deliveryPartner: "Rio in-house riders" },
  { name: "Nairobi CBD", county: "Nairobi", town: "CBD", fee: 150, expressFee: 300, deliveryTime: "Same day (order before 2pm)", sameDay: true, pickup: true, codAvailable: true, minOrder: 500 },
  { name: "Westlands", county: "Nairobi", town: "Westlands", fee: 150, expressFee: 300, deliveryTime: "Same day (order before 2pm)", sameDay: true, codAvailable: true, minOrder: 500 },
  { name: "Kilimani", county: "Nairobi", town: "Kilimani", fee: 180, expressFee: 350, deliveryTime: "Same day (order before 2pm)", sameDay: true, codAvailable: true, minOrder: 500 },
  { name: "Karen", county: "Nairobi", town: "Karen", fee: 250, expressFee: 450, deliveryTime: "Next day", codAvailable: true, minOrder: 500 },
  { name: "Kasarani", county: "Nairobi", town: "Kasarani", fee: 250, expressFee: 450, deliveryTime: "Next day", codAvailable: true, minOrder: 500 },
  { name: "Ruaka", county: "Kiambu", town: "Ruaka", fee: 250, expressFee: 450, deliveryTime: "Next day", sameDay: true, codAvailable: true, minOrder: 500, deliveryPartner: "Ruaka riders" },
  { name: "Kiambu County", county: "Kiambu", fee: 250, expressFee: 450, deliveryTime: "1-2 business days", sameDay: true, codAvailable: true, minOrder: 500 },
  { name: "Thika", county: "Kiambu", town: "Thika", fee: 250, expressFee: 450, deliveryTime: "1-2 business days", codAvailable: true, minOrder: 500 },
  { name: "Mombasa", county: "Mombasa", fee: 350, expressFee: 600, deliveryTime: "2-3 business days", codAvailable: true, minOrder: 1000, deliveryPartner: "Coastal couriers" },
  { name: "Nakuru", county: "Nakuru", fee: 300, expressFee: 550, deliveryTime: "2-3 business days", codAvailable: true, minOrder: 1000 },
  { name: "Kisumu", county: "Kisumu", fee: 350, expressFee: 600, deliveryTime: "2-3 business days", codAvailable: true, minOrder: 1000 },
  { name: "Eldoret", county: "Uasin Gishu", town: "Eldoret", fee: 350, expressFee: 600, deliveryTime: "2-3 business days", codAvailable: true, minOrder: 1000 },
  { name: "Athi River", county: "Machakos", town: "Athi River", fee: 250, expressFee: 450, deliveryTime: "1-2 business days", sameDay: true, codAvailable: true, minOrder: 500 },
  { name: "Kitengela", county: "Kajiado", town: "Kitengela", fee: 250, expressFee: 450, deliveryTime: "1-2 business days", sameDay: true, codAvailable: true, minOrder: 500 },
  ];
  // County-wide zones are stored with a null town. Older rows used an empty
  // string, which broke exact town matching during delivery quotes.
  await prisma.deliveryZone.updateMany({ where: { town: "" }, data: { town: null } });
  for (const z of zones) {
  const town = z.town ?? null;
  const data = {
  name: z.name,
  county: z.county,
  town,
  fee: z.fee,
  expressFee: z.expressFee,
  deliveryTime: z.deliveryTime,
  sameDay: z.sameDay ?? false,
  pickup: z.pickup ?? false,
  codAvailable: z.codAvailable ?? false,
  minOrder: z.minOrder ?? 0,
  maxOrder: z.maxOrder,
  deliveryPartner: z.deliveryPartner,
  active: true,
  };
  // findFirst instead of upsert: the county/town compound key cannot express a
  // null town, and county-wide zones are exactly the null-town rows.
  const existing = await prisma.deliveryZone.findFirst({
    where: { county: z.county, town },
    select: { id: true },
  });
  if (existing) {
    await prisma.deliveryZone.update({ where: { id: existing.id }, data });
  } else {
    await prisma.deliveryZone.create({ data });
  }
  }

 // ---- Gift wrap ----
 const wraps = [
 { name: "Standard Gift Box", sku: "WRAP-STD", price: 150, description: "Rigid kraft box with tissue and sticker." },
 { name: "Premium Box + Ribbon", sku: "WRAP-PRM", price: 350, description: "Gift-ready box, satin ribbon and a ZED card." },
 { name: "Luxury Box + Personal Card", sku: "WRAP-LUX", price: 650, description: "Signature box with a handwritten-style card." },
 ];
 for (const w of wraps) {
 await prisma.giftWrap.upsert({
 where: { sku: w.sku ?? "" },
 update: { name: w.name, price: w.price, description: w.description, active: true },
 create: { name: w.name, sku: w.sku, price: w.price, description: w.description, active: true, sortOrder: w.price },
 });
 }

 // ---- Coupons ----
 const coupons = [
 { code: "WELCOME10", type: "PERCENTAGE" as const, value: 10, minSpend: 0, description: null },
 { code: "ZED2-500", type: "FIXED" as const, value: 500, minSpend: 3000, description: "KES 500 off orders over 3,000." },
 { code: "KENYAN10", type: "PERCENTAGE" as const, value: 10, minSpend: 2500, description: null },
 ];
 for (const c of coupons) {
 await prisma.coupon.upsert({
 where: { code: c.code },
 update: { type: c.type, value: c.value, minSpend: c.minSpend, active: true, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90) },
 create: {
 code: c.code,
 type: c.type,
 value: c.value,
 minSpend: c.minSpend,
 active: true,
 scope: "ALL",
 expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
 },
 });
 }

  // ---- Sample order for the demo user ----
  const giftA = await prisma.product.findUnique({ where: { slug: "custom-logo-jute-tote-bags" } });
  const giftB = await prisma.product.findUnique({ where: { slug: "branded-2027-diaries-at-rio-gift-shop" } });
  if (giftA && giftB) {
  const existing = await prisma.order.findFirst({ where: { email: demo.email } });
  if (!existing) {
  const subtotal = giftA.price + giftB.price;
  await prisma.order.create({
  data: {
  orderNumber: `ZED2-${Date.now().toString().slice(-8)}`,
  userId: demo.id,
  name: demo.name,
  email: demo.email,
  phone: "+254712345678",
  subtotal,
  discount: 0,
  deliveryFee: 150,
  total: subtotal + 150,
  deliveryMethod: "STANDARD",
  county: "Nairobi",
  town: "Kilimani",
  address: "Sample Apartment, Rose Avenue",
  orderStatus: "DELIVERED",
  paymentStatus: "SUCCESSFUL",
  isGift: true,
  items: {
  create: [
  {
  productId: giftA.id,
  name: giftA.name,
  sku: giftA.sku,
  image: photoUrl(PRODUCT_PHOTO["product-01"] ?? "photo-1544716278-ca5e3f4abd8c"),
  price: giftA.price,
  quantity: 1,
  },
  {
  productId: giftB.id,
  name: giftB.name,
  sku: giftB.sku,
  image: photoUrl(PRODUCT_PHOTO["product-02"] ?? "photo-1583743814966-8936f5b7be1a"),
  price: giftB.price,
  quantity: 1,
  personalizationJson: JSON.stringify({ engravingText: "ZED 2" }),
  },
  ],
  },
  payments: {
  create: [
  {
  provider: "M_PESA",
  status: "SUCCESSFUL",
  amount: subtotal + 150,
  phone: "254712345678",
  mpesaReceipt: "SEEDSMP1",
  resultCode: 0,
  resultDescription: "The service request is processed successfully.",
  transactionDate: new Date(),
  },
  ],
  },
  },
  });
  }
  }

  console.log("Seed complete: users, categories, collections, products, delivery zones, gift wraps, coupons, sample order.");
}

main()
 .catch((err) => {
 console.error(err);
 process.exit(1);
 })
 .finally(() => prisma.$disconnect());
