import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { RIO_CATEGORIES, RIO_PRODUCTS } from "./rio-catalogue";
import { productPhotoUrl } from "../scripts/demo-images";

const prisma = new PrismaClient();

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

async function main() {
  // Create-only upserts intentionally preserve existing admin edits and stock.
  const knownCategories = new Set<string>();

  for (const [index, parent] of RIO_CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: parent.slug },
      update: {},
      create: {
        slug: parent.slug,
        name: parent.name,
        kind: "CATEGORY",
        sortOrder: index,
        active: true,
        image: `/placeholders/category-${parent.slug}.svg`,
        seoTitle: `${parent.name} gifts in Kenya | ZED Gift Shop 2`,
      },
    });
    knownCategories.add(parent.slug);

    for (const [childIndex, child] of (parent.children ?? []).entries()) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: {
          slug: child.slug,
          name: child.name,
          kind: "CATEGORY",
          parent: { connect: { slug: parent.slug } },
          sortOrder: childIndex,
          active: true,
          image: `/placeholders/category-${child.slug}.svg`,
        },
      });
      knownCategories.add(child.slug);
    }
  }

  for (const [slug, name, kind] of occasions) {
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name,
        kind,
        active: true,
        image: `/placeholders/occasion-${slug}.svg`,
      },
    });
    knownCategories.add(slug);
  }

  for (const [slug, name] of recipients) {
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name,
        kind: "RECIPIENT",
        active: true,
        image: `/placeholders/recipient-${slug.replace(/^for-/, "")}.svg`,
      },
    });
    knownCategories.add(slug);
  }

  for (const slug of new Set(RIO_PRODUCTS.flatMap((product) => product.categories))) {
    if (knownCategories.has(slug)) continue;
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { slug, name: titleFromSlug(slug), kind: "CATEGORY", active: true },
    });
    knownCategories.add(slug);
  }

  for (const [slug, name, description, featured] of collections) {
    await prisma.collection.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name,
        description,
        featured,
        image: `/placeholders/collection-${slug}.svg`,
      },
    });
  }

  let created = 0;
  for (const [index, item] of RIO_PRODUCTS.entries()) {
    const existing = await prisma.product.findUnique({ where: { slug: item.slug }, select: { id: true } });
    if (existing) continue;

    const product = await prisma.product.create({
      data: {
        slug: item.slug,
        name: item.name,
        shortDescription: item.shortDescription,
        description: item.description,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        sku: `ZED2-${item.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 24)}`,
        tags: item.tags ?? [],
        status: "ACTIVE",
        featured: item.featured ?? false,
        bestSeller: item.bestSeller ?? false,
        publishedAt: new Date(Date.now() - index * 60_000),
        quantity: item.quantity ?? 60,
        trackInventory: true,
        personalizationEnabled: item.personalizationEnabled ?? false,
        giftWrapAvailable: item.giftWrapAvailable ?? true,
        giftMessageAvailable: true,
        images: {
          create: [{
            url: productPhotoUrl(item.slug) ?? `/placeholders/product-${String((index % 16) + 1).padStart(2, "0")}.svg`,
            alt: item.name,
            sortOrder: 0,
            isPrimary: true,
          }],
        },
      },
    });

    for (const [sortOrder, slug] of item.categories.entries()) {
      if (!knownCategories.has(slug)) continue;
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: (await prisma.category.findUniqueOrThrow({ where: { slug }, select: { id: true } })).id } },
        update: {},
        create: {
          productId: product.id,
          categoryId: (await prisma.category.findUniqueOrThrow({ where: { slug }, select: { id: true } })).id,
          sortOrder,
        },
      });
    }

    const collectionSlug = item.bestSeller ? "bestsellers" : "new-arrivals";
    const collection = await prisma.collection.findUnique({ where: { slug: collectionSlug }, select: { id: true } });
    if (collection) {
      await prisma.productCollection.upsert({
        where: { productId_collectionId: { productId: product.id, collectionId: collection.id } },
        update: {},
        create: { productId: product.id, collectionId: collection.id },
      });
    }
    created += 1;
  }

  const adminEmail = process.env.ZED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ZED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 16) {
      throw new Error("ZED_ADMIN_PASSWORD must be at least 16 characters.");
    }
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, role: true },
    });
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: process.env.ZED_ADMIN_NAME?.trim() || "Store Administrator",
          passwordHash: await bcrypt.hash(adminPassword, 12),
          role: "ADMIN",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });
      console.log("Created the configured initial admin account.");
    } else if (existingAdmin.role !== "ADMIN") {
      console.warn("ZED_ADMIN_EMAIL already belongs to a non-admin account; it was not promoted automatically.");
    }
  } else {
    console.warn("No initial admin created. Configure ZED_ADMIN_EMAIL and a 16+ character ZED_ADMIN_PASSWORD in Vercel.");
  }

  console.log(`Catalogue bootstrap complete; added ${created} products without overwriting existing products.`);
}

main()
  .catch((error) => {
    console.error("Catalogue bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
