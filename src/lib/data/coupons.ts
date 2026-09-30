import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CartItem } from "@prisma/client";

export async function findCoupon(code: string) {
 return prisma.coupon.findUnique({
 where: { code: code.trim().toUpperCase() },
 include: { products: true, categories: true, collections: true },
 });
}

export type CouponValidation = {
 ok: boolean;
 error?: string;
 discount?: number;
 coupon?: NonNullable<Awaited<ReturnType<typeof findCoupon>>>;
};

export async function validateCouponForCart(
 code: string,
 subtotal: number,
 productIds: string[],
): Promise<CouponValidation> {
 const coupon = await findCoupon(code);
 if (!coupon) return { ok: false, error: "That coupon code doesn't exist." };
 if (!coupon.active) return { ok: false, error: "That coupon is no longer active." };
 if (coupon.expiresAt && coupon.expiresAt < new Date()) {
 return { ok: false, error: "That coupon has expired." };
 }
 if (coupon.startsAt && coupon.startsAt > new Date()) {
 return { ok: false, error: "That coupon isn't active yet." };
 }
 if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
 return { ok: false, error: "That coupon has reached its usage limit." };
 }
 if (subtotal < coupon.minSpend) {
 return { ok: false, error: `Spend at least ${new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(coupon.minSpend)} to use this coupon.` };
 }

 // Scope checks
 if (coupon.scope === "PRODUCT" && coupon.scopeId) {
 if (!productIds.includes(coupon.scopeId)) {
 return { ok: false, error: "This coupon only applies to specific products that aren't in your cart." };
 }
 }
 if (coupon.scope === "CATEGORY" && coupon.scopeId) {
 const match = await prisma.productCategory.findFirst({
 where: { categoryId: coupon.scopeId, productId: { in: productIds } },
 });
 if (!match) {
 return { ok: false, error: "This coupon only applies to a specific category." };
 }
 }
 if (coupon.scope === "COLLECTION" && coupon.scopeId) {
 const match = await prisma.productCollection.findFirst({
 where: { collectionId: coupon.scopeId, productId: { in: productIds } },
 });
 if (!match) {
 return { ok: false, error: "This coupon only applies to a specific collection." };
 }
 }

 let discount = 0;
 if (coupon.type === "PERCENTAGE") {
 discount = Math.round((subtotal * coupon.value) / 100);
 } else {
 discount = coupon.value;
 }
 discount = Math.min(discount, subtotal);
 return { ok: true, discount, coupon };
}

export async function incrementCouponUsage(couponId: string) {
 await prisma.coupon.update({
 where: { id: couponId },
 data: { usedCount: { increment: 1 } },
 });
}

export async function listValidCoupons() {
 return prisma.coupon.findMany({
 where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
 orderBy: { createdAt: "desc" },
 take: 50,
 });
}

export type CartItemWithProduct = Prisma.CartItemGetPayload<{
 include: {
 product: {
 include: { images: { take: 1 }, variants: true };
 };
 variant: true;
 };
}>;

export type { CartItem };