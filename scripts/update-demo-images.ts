import { PrismaClient } from "@prisma/client";
import {
  COLLECTION_PHOTO,
  OCCASION_PHOTO,
  PRODUCT_PHOTO,
  RECIPIENT_PHOTO,
  photoUrl,
} from "./demo-images";

const prisma = new PrismaClient();

async function updateProductImages() {
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, images: { select: { id: true, url: true }, orderBy: { sortOrder: "asc" } } },
  });
  let updated = 0;
  for (const [key, photoKey] of Object.entries(PRODUCT_PHOTO)) {
    const product = products.find((p) => p.images[0]?.url === `/placeholders/${key}.svg`);
    if (!product) continue;
    await prisma.productImage.update({ where: { id: product.images[0].id }, data: { url: photoUrl(photoKey) } });
    updated++;
  }
  return updated;
}

async function updateCollectionImages() {
  let updated = 0;
  for (const [slug, photoKey] of Object.entries(COLLECTION_PHOTO)) {
    const collection = await prisma.collection.findUnique({ select: { id: true }, where: { slug } });
    if (!collection) continue;
    await prisma.collection.update({ where: { id: collection.id }, data: { image: photoUrl(photoKey) } });
    updated++;
  }
  return updated;
}

async function updateCategoryImages() {
  let updated = 0;
  const bySlug: Record<string, string> = {};
  for (const [slug, photoKey] of Object.entries({ ...OCCASION_PHOTO, ...RECIPIENT_PHOTO })) bySlug[slug] = photoUrl(photoKey);
  for (const [slug, url] of Object.entries(bySlug)) {
    const category = await prisma.category.findUnique({ select: { id: true }, where: { slug } });
    if (!category) continue;
    await prisma.category.update({ where: { id: category.id }, data: { image: url } });
    updated++;
  }
  return updated;
}

async function main() {
  const products = await updateProductImages();
  const collections = await updateCollectionImages();
  const categories = await updateCategoryImages();
  console.log(`Demo images applied: ${products} products, ${collections} collections, ${categories} categories.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());