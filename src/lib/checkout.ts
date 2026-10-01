import "server-only";

import { prisma } from "@/lib/prisma";
import { getOrCreateCart, unitPrice } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { validateCouponForCart } from "@/lib/data/coupons";
import { quoteDeliveryFor, type DeliveryOption } from "@/lib/data/delivery";
import { createOrder } from "@/lib/data/orders";
import { reserveWithinTx, OutOfStockError } from "@/lib/inventory";
import type { DeliveryMethod } from "@prisma/client";

export type CheckoutInput = {
  name: string;
  email: string;
  phone: string;
  county: string;
  town: string;
  area?: string;
  street?: string;
  address: string;
  building?: string;
  apartment?: string;
  landmark?: string;
  instructions?: string;
  deliveryMethod: DeliveryMethod;
  couponCode?: string | null;
  isGift?: boolean;
  paymentMethod?: "M_PESA" | "FLUTTERWAVE" | "CARD" | "BANK_TRANSFER" | "COD";
};

export type CheckoutResult =
 | {
 ok: true;
 order: { orderId: string; orderNumber: string };
 totals: { subtotal: number; discount: number; deliveryFee: number; total: number };
 deliveryOption: DeliveryOption | null;
 }
 | { ok: false; error: string };

export async function createOrderFromCart(input: CheckoutInput): Promise<CheckoutResult> {
 const { cart } = await getOrCreateCart();
 const items = cart.items.filter((i) => i.savedForLater === false);
 const session = await getSession();
 const sessionUserId = session?.sub ?? null;

 if (items.length === 0) {
 return { ok: false, error: "Your cart is empty." };
 }

 // Validate stock one more time (authoritative).
 for (const item of items) {
 const totalAvailable =
 item.product.trackInventory === false ? Infinity : item.product.quantity - item.product.reservedQuantity;
 if (item.product.status !== "ACTIVE") {
 return { ok: false, error: `${item.product.name} is no longer available.` };
 }
 if (totalAvailable < item.quantity) {
 return { ok: false, error: `Only ${Math.max(0, totalAvailable)} of ${item.product.name} left in stock.` };
 }
 }

 let subtotal = 0;
 for (const item of items) {
 const { price, giftWrapPrice } = unitPrice(item);
 subtotal += (price + giftWrapPrice) * item.quantity;
 }

 let discount = 0;
 let couponId: string | null = null;
 if (cart.couponCode) {
 const validation = await validateCouponForCart(
 cart.couponCode,
 subtotal,
 items.map((i) => i.productId),
 );
 if (!validation.ok) {
 return { ok: false, error: validation.error ?? "That coupon is invalid." };
 }
 discount = validation.discount ?? 0;
 couponId = validation.coupon?.id ?? null;
 }

const paymentMethod = input.paymentMethod ?? "M_PESA";
  const netTotal = Math.max(0, subtotal - discount);
  const allProductsCodEligible = items.every((i) => i.product.codEligible);

  // One quote drives the fee, the promise date and the cash-on-delivery rules,
  // so the customer is never shown a combination the server will reject.
  const quote = await quoteDeliveryFor({
    county: input.county,
    town: input.town,
    subtotal: netTotal,
    allProductsCodEligible,
  });

  const deliveryOption =
    input.deliveryMethod === "PICKUP"
      ? quote.options.find((o) => o.pickup) ?? null
      : quote.options.find((o) => o.method === input.deliveryMethod) ?? null;

  if (!deliveryOption) {
    return { ok: false, error: "That delivery option isn't available for the selected area." };
  }
  const deliveryFee = deliveryOption.fee;

  if (netTotal < quote.minOrder) {
    return {
      ok: false,
      error: `This order is below the KES ${quote.minOrder.toLocaleString("en-KE")} minimum for ${quote.zone?.name ?? input.county}.`,
    };
  }
  if (quote.maxOrder != null && netTotal > quote.maxOrder) {
    return {
      ok: false,
      error: `This order is above the KES ${quote.maxOrder.toLocaleString("en-KE")} maximum for ${quote.zone?.name ?? input.county}.`,
    };
  }

  // Cash on delivery is a zone and product decision, never a client preference.
  if (paymentMethod === "COD" && !quote.codAvailable) {
    return { ok: false, error: quote.codReason ?? "Cash on delivery is not available for this address." };
  }

const orderItems = items.map((i) => ({
  productId: i.productId,
  variantId: i.variantId,
  name: i.product.name,
  sku: i.product.sku ?? i.variant?.sku ?? null,
  image: i.product.images[0]?.url ?? null,
  price: unitPrice(i).price,
  quantity: i.quantity,
  giftWrapPrice: unitPrice(i).giftWrapPrice,
  personalizationJson: i.personalizationJson,
  giftWrapJson: i.giftWrapJson,
  giftMessageJson: i.giftMessageJson,
  }));

  // Order creation, stock reservation and cart cleanup must land together.
  // If any part fails the whole thing rolls back, so a customer can never end
  // up with an order that has no reserved stock (or stock held for no order).
  let order: { orderId: string; orderNumber: string };
  try {
    order = await prisma.$transaction(async (tx) => {
      // Reuses the canonical order writer so numbering, delivery fee and
      // status defaults stay identical to every other order entry point.
      const created = await createOrder(
        {
          userId: sessionUserId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          county: input.county,
          town: input.town,
          area: input.area || null,
          street: input.street || null,
          address: input.address,
          building: input.building || null,
          apartment: input.apartment || null,
          landmark: input.landmark || null,
          deliveryInstructions: input.instructions || null,
          deliveryMethod: input.deliveryMethod,
          items: orderItems,
          subtotal,
          discount,
          couponCode: cart.couponCode,
          couponId,
          isGift: input.isGift ?? false,
        },
        {
          tx,
          deliveryFee,
          estimatedDeliveryDate: deliveryOption.estimatedDeliveryDate ?? null,
          deliveryPartner: quote.zone?.deliveryPartner ?? null,
        },
      );

      // Guarded reservation: the database refuses any line that would
      // oversell, and a shortfall unwinds the whole order.
      await reserveWithinTx(
        tx,
        orderItems.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        `Order ${created.orderNumber}`,
      );

      // Clear the cart and coupon so a stale cart can't be reused.
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });

      return created;
    });
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return { ok: false, error: "Some items just sold out. Please review your cart and try again." };
    }
    console.error("[checkout] order transaction failed", error);
    return { ok: false, error: "We couldn't complete your order. Please try again." };
  }
  // NOTE: keep the same cart session id cookie; it stays empty until next add.

  const totals = { subtotal, discount, deliveryFee, total: Math.max(0, subtotal - discount) + deliveryFee };
  return { ok: true, order, totals, deliveryOption };
}

export async function createPaymentForOrder(input: {
 orderId: string;
 amount: number;
 phone: string;
 checkoutRequestId?: string;
 merchantRequestId?: string;
 status?: "PENDING" | "FAILED";
}) {
 return prisma.payment.create({
 data: {
 orderId: input.orderId,
 provider: "M_PESA",
 status: input.status ?? "PENDING",
 amount: input.amount,
 phone: input.phone,
 checkoutRequestId: input.checkoutRequestId,
 merchantRequestId: input.merchantRequestId,
 },
 });
}