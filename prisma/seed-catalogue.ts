import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { RIO_CATEGORIES, RIO_PRODUCTS } from "./rio-catalogue";
import { productPhotoUrl } from "../scripts/demo-images";

/**
 * Idempotent catalogue bootstrap through Supabase's Data API.
 * Existing products and collection customizations are intentionally preserved.
 */
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Catalogue bootstrap requires SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const occasions = [
  ["birthday", "Birthday", "OCCASION"],
  ["anniversary", "Anniversary", "OCCASION"],
  ["graduation", "Graduation", "OCCASION"],
  ["corporate", "Corporate Gifts", "OCCASION"],
  ["valentines", "Valentine's Day", "OCCASION"],
  ["fathers-day", "Father's Day", "OCCASION"],
  ["wedding", "Wedding", "OCCASION"],
  ["just-because", "Just Because", "OCCASION"],
] as const;

const recipients = [
  ["for-him", "Gifts for Him"],
  ["for-her", "Gifts for Her"],
  ["for-couples", "Gifts for Couples"],
  ["for-friends", "Gifts for Friends"],
  ["for-parents", "Gifts for Parents"],
  ["for-colleagues", "Gifts for Colleagues"],
] as const;

const collections = [
  ["bestsellers", "Bestsellers", "The gifts customers keep coming back for.", true],
  ["new-arrivals", "New Arrivals", "Fresh gift ideas for every occasion.", true],
  ["corporate", "Corporate Gifts", "Curated gifts for teams, clients and events.", false],
  ["personalized-picks", "Personalized Picks", "Gifts made extra special with a name or message.", false],
  ["home-and-living", "Home & Living", "Thoughtful pieces for the home.", false],
  ["gourmet", "Gourmet", "Food and drink gifts for celebrations.", false],
] as const;

function titleFromSlug(slug: string) {
  return slug.split("-").map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
}

function fail(context: string, error: { message: string } | null) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function main() {
  const supabase = getSupabaseAdmin();
  const knownCategories = new Set<string>();
  const categoryIds = new Map<string, string>();

  async function upsertCategory(row: Record<string, unknown>) {
    const { data, error } = await supabase
      .from("Category")
      .upsert(row, { onConflict: "slug" })
      .select("id,slug")
      .single();
    fail(`Could not save category ${String(row.slug)}`, error);
    if (!data) throw new Error(`No category returned for ${String(row.slug)}`);
    categoryIds.set(data.slug, data.id);
    knownCategories.add(data.slug);
    return data.id as string;
  }

  for (const [index, parent] of RIO_CATEGORIES.entries()) {
    const parentId = await upsertCategory({
      slug: parent.slug,
      name: parent.name,
      kind: "CATEGORY",
      parentId: null,
      sortOrder: index,
      active: true,
      image: `/placeholders/category-${parent.slug}.svg`,
      seoTitle: `${parent.name} gifts in Kenya | ZED Gift Shop 2`,
    });

    for (const [childIndex, child] of (parent.children ?? []).entries()) {
      await upsertCategory({
        slug: child.slug,
        name: child.name,
        kind: "CATEGORY",
        parentId,
        sortOrder: childIndex,
        active: true,
        image: `/placeholders/category-${child.slug}.svg`,
      });
    }
  }

  for (const [slug, name, kind] of occasions) {
    const { data: existing, error: lookupError } = await supabase
      .from("Category").select("id").eq("slug", slug).maybeSingle();
    fail(`Could not look up category ${slug}`, lookupError);
    if (existing) {
      categoryIds.set(slug, existing.id);
      knownCategories.add(slug);
    } else {
      await upsertCategory({ slug, name, kind, active: true, image: `/placeholders/occasion-${slug}.svg` });
    }
  }

  for (const [slug, name] of recipients) {
    const { data: existing, error: lookupError } = await supabase
      .from("Category").select("id").eq("slug", slug).maybeSingle();
    fail(`Could not look up category ${slug}`, lookupError);
    if (existing) {
      categoryIds.set(slug, existing.id);
      knownCategories.add(slug);
    } else {
      await upsertCategory({ slug, name, kind: "RECIPIENT", active: true, image: `/placeholders/recipient-${slug.replace(/^for-/, "")}.svg` });
    }
  }

  for (const slug of new Set(RIO_PRODUCTS.flatMap((product) => product.categories))) {
    if (knownCategories.has(slug)) continue;
    const { data: existing, error: lookupError } = await supabase
      .from("Category").select("id").eq("slug", slug).maybeSingle();
    fail(`Could not look up category ${slug}`, lookupError);
    if (existing) {
      categoryIds.set(slug, existing.id);
      knownCategories.add(slug);
    } else {
      await upsertCategory({ slug, name: titleFromSlug(slug), kind: "CATEGORY", active: true });
    }
  }

  const collectionIds = new Map<string, string>();
  for (const [slug, name, description, featured] of collections) {
    const { data: existing, error: lookupError } = await supabase
      .from("Collection").select("id").eq("slug", slug).maybeSingle();
    fail(`Could not look up collection ${slug}`, lookupError);
    if (existing) {
      collectionIds.set(slug, existing.id);
      continue;
    }
    const { data, error } = await supabase.from("Collection").insert({
      id: randomUUID(), slug, name, description, featured,
      image: `/placeholders/collection-${slug}.svg`,
    }).select("id").single();
    fail(`Could not create collection ${slug}`, error);
    if (!data) throw new Error(`No collection returned for ${slug}`);
    collectionIds.set(slug, data.id);
  }

  let created = 0;
  for (const [index, item] of RIO_PRODUCTS.entries()) {
    const { data: existing, error: lookupError } = await supabase
      .from("Product").select("id").eq("slug", item.slug).maybeSingle();
    fail(`Could not look up product ${item.slug}`, lookupError);
    if (existing) continue;

    const { data: product, error: productError } = await supabase.from("Product").insert({
      id: randomUUID(),
      slug: item.slug,
      name: item.name,
      shortDescription: item.shortDescription,
      description: item.description,
      price: item.price,
      compareAtPrice: item.compareAtPrice ?? null,
      sku: `ZED2-${item.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 24)}`,
      tags: item.tags ?? [],
      status: "ACTIVE",
      featured: item.featured ?? false,
      bestSeller: item.bestSeller ?? false,
      publishedAt: new Date(Date.now() - index * 60_000).toISOString(),
      quantity: item.quantity ?? 60,
      trackInventory: true,
      personalizationEnabled: item.personalizationEnabled ?? false,
      giftWrapAvailable: item.giftWrapAvailable ?? true,
      giftMessageAvailable: true,
    }).select("id").single();
    fail(`Could not create product ${item.slug}`, productError);
    if (!product) throw new Error(`No product returned for ${item.slug}`);

    const imageUrl = productPhotoUrl(item.slug) ?? `/placeholders/product-${String((index % 16) + 1).padStart(2, "0")}.svg`;
    const { error: imageError } = await supabase.from("ProductImage").insert({
      id: randomUUID(), productId: product.id, url: imageUrl, alt: item.name,
      sortOrder: 0, isPrimary: true,
    });
    fail(`Could not add image for ${item.slug}`, imageError);

    for (const [sortOrder, slug] of item.categories.entries()) {
      const categoryId = categoryIds.get(slug);
      if (!knownCategories.has(slug) || !categoryId) continue;
      const { error } = await supabase.from("ProductCategory").upsert({
        productId: product.id, categoryId, sortOrder,
      }, { onConflict: "productId,categoryId", ignoreDuplicates: true });
      fail(`Could not link product ${item.slug} to category ${slug}`, error);
    }

    const collectionSlug = item.bestSeller ? "bestsellers" : "new-arrivals";
    const collectionId = collectionIds.get(collectionSlug);
    if (collectionId) {
      const { error } = await supabase.from("ProductCollection").upsert({
        productId: product.id, collectionId, sortOrder: 0,
      }, { onConflict: "productId,collectionId", ignoreDuplicates: true });
      fail(`Could not link product ${item.slug} to collection ${collectionSlug}`, error);
    }
    created += 1;
  }

  console.log(`Supabase catalogue bootstrap complete; added ${created} products without overwriting existing products.`);
}

main().catch((error) => {
  console.error("Catalogue bootstrap failed:", error);
  process.exitCode = 1;
});
