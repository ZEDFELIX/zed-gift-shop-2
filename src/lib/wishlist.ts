import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_KEYS } from "@/lib/constants";

const WISH_COOKIE = COOKIE_KEYS.wishlist;

function parseIds(raw: string | undefined): string[] {
 if (!raw) return [];
 try {
 const arr = JSON.parse(raw);
 return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
 } catch {
 return [];
 }
}

export async function getWishlistIds(userId: string | null): Promise<string[]> {
 if (userId) {
 const wishlist = await prisma.wishlist.findUnique({
 where: { userId },
 include: { items: { select: { productId: true } } },
 });
 return wishlist?.items.map((i) => i.productId) ?? [];
 }
 const store = await cookies();
 return parseIds(store.get(WISH_COOKIE)?.value);
}

async function saveCookieIds(ids: string[]) {
 const store = await cookies();
 store.set(WISH_COOKIE, JSON.stringify(ids.slice(0, 200)), {
 httpOnly: true,
 sameSite: "lax",
 secure: process.env.NODE_ENV === "production",
 path: "/",
 maxAge: 60 * 60 * 24 * 365,
 });
}

async function ensureWishlist(userId: string) {
 let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
 if (!wishlist) {
 wishlist = await prisma.wishlist.create({ data: { userId } });
 }
 return wishlist;
}

export async function toggleWishlist(userId: string | null, productId: string): Promise<{ ids: string[]; inWishlist: boolean }> {
 const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true } });
 if (!product || product.status !== "ACTIVE") return { ids: [], inWishlist: false };

 if (userId) {
 const wishlist = await ensureWishlist(userId);
 const existing = await prisma.wishlistItem.findUnique({
 where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
 });
 if (existing) {
 await prisma.wishlistItem.delete({ where: { id: existing.id } });
 } else {
 await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
 }
 return { ids: await getWishlistIds(userId), inWishlist: !existing };
 }

 const store = await cookies();
 const ids = parseIds(store.get(WISH_COOKIE)?.value);
 const exists = ids.includes(productId);
 const next = exists ? ids.filter((i) => i !== productId) : [...ids, productId];
 await saveCookieIds(next);
 return { ids: next, inWishlist: !exists };
}

export async function removeFromWishlist(userId: string | null, productId: string) {
 if (userId) {
 const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
 if (wishlist) {
 await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
 }
 } else {
 const store = await cookies();
 const ids = parseIds(store.get(WISH_COOKIE)?.value).filter((i) => i !== productId);
 await saveCookieIds(ids);
 }
 return getWishlistIds(userId);
}

export async function addToWishlist(userId: string | null, productId: string) {
 const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true } });
 if (!product || product.status !== "ACTIVE") return getWishlistIds(userId);

 if (userId) {
 const wishlist = await ensureWishlist(userId);
 await prisma.wishlistItem.upsert({
 where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
 update: {},
 create: { wishlistId: wishlist.id, productId },
 });
 } else {
 const store = await cookies();
 const ids = parseIds(store.get(WISH_COOKIE)?.value);
 if (!ids.includes(productId)) await saveCookieIds([...ids, productId]);
 }
 return getWishlistIds(userId);
}

export async function getWishlistProducts(userId: string | null) {
 const ids = await getWishlistIds(userId);
 if (ids.length === 0) return [];
 const products = await prisma.product.findMany({
 where: { id: { in: ids }, status: "ACTIVE" },
 include: {
 images: { orderBy: { sortOrder: "asc" as const } },
 categories: { include: { category: true } },
 collections: { include: { collection: true } },
 variants: { where: { active: true } },
 },
 });
 const byId = new Map(products.map((p) => [p.id, p]));
 return ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
}

export async function moveWishlistItemToCart(userId: string | null, productId: string) {
 // Reuse the wishlist item product; the caller then adds to cart via cart API.
 return getWishlistProducts(userId);
}

export async function syncWishlistCookieToDb(userId: string, cookieIds: string[]) {
 if (cookieIds.length === 0) return;
 const wishlist = await ensureWishlist(userId);
 await prisma.$transaction(
 cookieIds.map((productId) =>
 prisma.wishlistItem.upsert({
 where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
 update: {},
 create: { wishlistId: wishlist.id, productId },
 }),
 ),
 );
}