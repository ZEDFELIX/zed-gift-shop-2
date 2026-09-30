import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_KEYS, CART_MAX_ITEMS, type CartItemPayload } from "@/lib/constants";
import { validateCouponForCart } from "@/lib/data/coupons";
import { getDeliveryZoneForCounty } from "@/lib/data/delivery";
import { Prisma } from "@prisma/client";

const CART_COOKIE = COOKIE_KEYS.cart;

const cartInclude = {
 items: {
 include: {
 product: {
 include: {
 images: { orderBy: { sortOrder: "asc" as const } },
 },
 },
 variant: true,
 },
 orderBy: { createdAt: "desc" as const },
 },
} as const;

type CartRecord = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function safeJson<T>(value: string | null, fallback: T): T {
 if (!value) return fallback;
 try {
 return JSON.parse(value) as T;
 } catch {
 return fallback;
 }
}

export function unitPrice(item: CartRecord["items"][number]) {
 const base = item.product.price;
 const offset = item.variant?.priceOffset ?? 0;
 const giftWrapPrice = safeJson<{ price: number } | null>(item.giftWrapJson, null)?.price ?? 0;
 return {
 price: base + offset,
 compareAt: item.product.compareAtPrice != null ? item.product.compareAtPrice + offset : null,
 giftWrapPrice,
 };
}

async function readCartById(cartId: string): Promise<CartRecord | null> {
 return prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude }) as unknown as Promise<CartRecord | null>;
}

export async function getOrCreateCart(): Promise<{ cart: CartRecord }> {
 const store = await cookies();
 const cartId = store.get(CART_COOKIE)?.value;

 let cart = cartId ? await readCartById(cartId) : null;

 if (!cart) {
 cart = (await prisma.cart.create({
 data: { sessionId: crypto.randomUUID() },
 include: cartInclude,
 })) as CartRecord;
 store.set(CART_COOKIE, cart.id, {
 httpOnly: true,
 sameSite: "lax",
 secure: process.env.NODE_ENV === "production",
 path: "/",
 maxAge: 60 * 60 * 24 * 60,
 });
 }

 return { cart };
}

export async function readCart(): Promise<{ cart: CartRecord | null }> {
 const store = await cookies();
 const cartId = store.get(CART_COOKIE)?.value;
 if (!cartId) return { cart: null };
 const cart = await readCartById(cartId);
 return { cart };
}

export async function getCartForApi() {
 const { cart } = await getOrCreateCart();
 return serializeCart(cart);
}

export async function serializeCart(cart: CartRecord) {
 const items = cart.items.filter((i) => i.savedForLater === false);
 const savedItems = cart.items.filter((i) => i.savedForLater === true);

 let subtotal = 0;
 for (const item of items) {
 const { price, giftWrapPrice } = unitPrice(item);
 subtotal += (price + giftWrapPrice) * item.quantity;
 }

 let couponInvalid = false;
 let discount = 0;
 if (cart.couponCode) {
 const productIds = items.map((i) => i.productId);
 const validation = await validateCouponForCart(cart.couponCode, subtotal, productIds);
 if (validation.ok) discount = validation.discount ?? 0;
 else couponInvalid = true;
 }

 return {
 id: cart.id,
 count: items.reduce((n, i) => n + i.quantity, 0),
 itemCount: items.length,
 savedCount: savedItems.length,
 lineCount: items.length + savedItems.length,
 items: items.map((i) => serializeItem(i)),
 savedItems: savedItems.map((i) => serializeItem(i)),
 subtotal,
 discount,
 total: Math.max(0, subtotal - discount),
 couponCode: couponInvalid ? null : cart.couponCode,
 couponInvalid,
 };
}

function serializeItem(item: CartRecord["items"][number]) {
 const { price, compareAt, giftWrapPrice } = unitPrice(item);
 const inStock = !item.product.trackInventory || item.product.quantity > 0;
 return {
 id: item.id,
 productId: item.productId,
 slug: item.product.slug,
 name: item.product.name,
 image: item.product.images[0]?.url ?? null,
 price,
 compareAt,
 quantity: item.quantity,
 lineTotal: (price + giftWrapPrice) * item.quantity,
 giftWrapPrice,
 variant: item.variant ? { id: item.variant.id, name: item.variant.name, value: item.variant.value } : null,
 personalization: safeJson<Record<string, unknown> | null>(item.personalizationJson, null),
 giftWrap: safeJson<{ name: string; price: number } | null>(item.giftWrapJson, null),
 giftMessage: safeJson<{ message: string; from?: string; to?: string } | null>(item.giftMessageJson, null),
 savedForLater: item.savedForLater,
 inStock,
 };
}

function parsePersonalization(payload: CartItemPayload) {
 return {
 personalizationJson: payload.personalization && Object.keys(payload.personalization).length ? JSON.stringify(payload.personalization) : null,
 giftWrapJson: payload.giftWrap ? JSON.stringify(payload.giftWrap) : null,
 giftMessageJson: payload.giftMessage ? JSON.stringify(payload.giftMessage) : null,
 };
}

export async function addToCart(payload: CartItemPayload) {
 const { cart } = await getOrCreateCart();

 const product = await prisma.product.findUnique({ where: { id: payload.productId } });
 if (!product || product.status !== "ACTIVE") return { ok: false, error: "This product is unavailable." };

 const variant = payload.variantId
 ? await prisma.productVariant.findFirst({ where: { id: payload.variantId, productId: product.id, active: true } })
 : null;
 if (payload.variantId && !variant) return { ok: false, error: "That option is unavailable." };

 const desiredQty = Math.min(99, Math.max(1, payload.quantity || 1));
 if (product.trackInventory) {
 const available = product.quantity - product.reservedQuantity;
 if (available < desiredQty) {
 return { ok: false, error: product.quantity <= 0 ? "This product is currently out of stock." : `Only ${available} left in stock.` };
 }
 }

 const existing = cart.items.find(
 (i) => i.productId === payload.productId && i.variantId === payload.variantId && i.savedForLater === false,
 );
 if (existing) {
 const newQty = existing.quantity + desiredQty;
 if (newQty > 99) return { ok: false, error: "Quantity exceeds the maximum allowed." };
 await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
 } else {
 if (cart.items.length >= CART_MAX_ITEMS) return { ok: false, error: "Your cart is full." };
 await prisma.cartItem.create({
 data: {
 cartId: cart.id,
 productId: product.id,
 variantId: variant?.id ?? null,
 quantity: desiredQty,
 ...parsePersonalization(payload),
 },
 });
 }

 const refreshed = await readCartById(cart.id);
 return { ok: true, cart: refreshed ? await serializeCart(refreshed) : null };
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
 const { cart } = await getOrCreateCart();
 const item = cart.items.find((i) => i.id === itemId);
 if (!item) return { ok: false, error: "Item not found in cart." };
 if (quantity < 1 || quantity > 99) return { ok: false, error: "Invalid quantity." };

 if (item.product.trackInventory) {
 const available = item.product.quantity - item.product.reservedQuantity;
 if (available < quantity) {
 return { ok: false, error: item.product.quantity <= 0 ? "This product is currently out of stock." : `Only ${available} left in stock.` };
 }
 }

 await prisma.cartItem.update({ where: { id: itemId }, data: { quantity, savedForLater: false } });
 return { ok: true, cart: await getCartForApi() };
}

export async function removeCartItem(itemId: string) {
 const { cart } = await getOrCreateCart();
 if (cart.items.some((i) => i.id === itemId)) {
 await prisma.cartItem.delete({ where: { id: itemId } });
 }
 return { ok: true, cart: await getCartForApi() };
}

export async function setSavedForLater(itemId: string, saved: boolean) {
 const { cart } = await getOrCreateCart();
 if (cart.items.some((i) => i.id === itemId)) {
 await prisma.cartItem.update({ where: { id: itemId }, data: { savedForLater: saved } });
 }
 return { ok: true, cart: await getCartForApi() };
}

export async function setItemPersonalization(itemId: string, personalization: Record<string, unknown> | null) {
 const { cart } = await getOrCreateCart();
 if (!cart.items.some((i) => i.id === itemId)) return { ok: false, error: "Item not found in cart." };
 await prisma.cartItem.update({
 where: { id: itemId },
 data: { personalizationJson: personalization ? JSON.stringify(personalization) : null },
 });
 return { ok: true, cart: await getCartForApi() };
}

export async function setItemGiftWrap(itemId: string, giftWrap: { id: string; name: string; price: number } | null) {
 const { cart } = await getOrCreateCart();
 if (!cart.items.some((i) => i.id === itemId)) return { ok: false, error: "Item not found in cart." };
 const wrap = giftWrap ? await prisma.giftWrap.findUnique({ where: { id: giftWrap.id } }) : null;
 if (giftWrap && !wrap) return { ok: false, error: "That gift wrap option is unavailable." };
 await prisma.cartItem.update({
 where: { id: itemId },
 data: { giftWrapJson: giftWrap ? JSON.stringify({ name: wrap!.name, price: wrap!.price }) : null },
 });
 return { ok: true, cart: await getCartForApi() };
}

export async function setItemGiftMessage(itemId: string, giftMessage: { message: string; from?: string; to?: string } | null) {
 const { cart } = await getOrCreateCart();
 if (!cart.items.some((i) => i.id === itemId)) return { ok: false, error: "Item not found in cart." };
 await prisma.cartItem.update({
 where: { id: itemId },
 data: { giftMessageJson: giftMessage && giftMessage.message ? JSON.stringify(giftMessage) : null },
 });
 return { ok: true, cart: await getCartForApi() };
}

export async function setCartCoupon(code: string | null) {
 const { cart } = await getOrCreateCart();
 await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: code ? code.trim().toUpperCase() : null } });
 return { ok: true, cart: await getCartForApi() };
}

export async function clearCart() {
 const { cart } = await getOrCreateCart();
 await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
 await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
 return { ok: true, cart: await getCartForApi() };
}

export async function cartCountForHeader() {
  try {
  const store = await cookies();
  const cartId = store.get(CART_COOKIE)?.value;
  if (!cartId) return 0;
  const items = await prisma.cartItem.findMany({
  where: { cartId, savedForLater: false },
  select: { quantity: true },
  });
  return items.reduce((n, i) => n + i.quantity, 0);
  } catch {
  return 0;
  }
}

/** Item count plus subtotal in whole KShs, for the header cart button. */
export async function cartSummaryForHeader(): Promise<{ count: number; subtotal: number }> {
  try {
  const store = await cookies();
  const cartId = store.get(CART_COOKIE)?.value;
  if (!cartId) return { count: 0, subtotal: 0 };
  const items = await prisma.cartItem.findMany({
  where: { cartId, savedForLater: false },
  select: {
  quantity: true,
  giftWrapJson: true,
  variant: { select: { priceOffset: true } },
  product: { select: { price: true } },
  },
  });
  let count = 0;
  let subtotal = 0;
  for (const item of items) {
  count += item.quantity;
  const giftWrap = safeJson<{ price: number } | null>(item.giftWrapJson, null)?.price ?? 0;
  const unit = item.product.price + (item.variant?.priceOffset ?? 0) + giftWrap;
  subtotal += unit * item.quantity;
  }
  return { count, subtotal: Math.round(subtotal) };
  } catch {
  return { count: 0, subtotal: 0 };
  }
}

export async function cartIdForCookie() {
 const { cart } = await getOrCreateCart();
 return cart.id;
}

export async function getDeliveryEstimateForCart(county?: string | null) {
 if (!county) return null;
 const zone = await getDeliveryZoneForCounty(county);
 if (!zone) return { county, fee: 800, note: "Countrywide delivery" };
 return { county, fee: zone.fee, note: zone.deliveryTime ?? "Standard delivery" };
}