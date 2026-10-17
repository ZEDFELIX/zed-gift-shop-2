import "server-only";

import { prisma } from "@/lib/prisma";
import { sendBackInStock } from "@/lib/email";
import { SITE } from "@/lib/constants";
import { logger } from "@/lib/logger";

function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE.url.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Emails every waiting customer once an item is genuinely available again.
 *
 * Called after any restock (inventory adjustment or product edit). Alerts only
 * fire when real availability is positive, and each alert is stamped with
 * `notifiedAt` so a customer is never emailed twice for the same wait.
 */
export async function notifyStockAlerts(productId: string): Promise<number> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        slug: true,
        name: true,
        trackInventory: true,
        quantity: true,
        reservedQuantity: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        variants: { select: { id: true, quantity: true, reservedQuantity: true } },
      },
    });
    if (!product) return 0;

    const pending = await prisma.stockAlert.findMany({
      where: { productId, notifiedAt: null },
      select: { id: true, email: true, variantId: true },
      take: 500,
    });
    if (pending.length === 0) return 0;

    const productAvailable = !product.trackInventory || product.quantity - product.reservedQuantity > 0;
    const isAvailable = (variantId: string | null): boolean => {
      if (!variantId) return productAvailable;
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) return false;
      return variant.quantity - variant.reservedQuantity > 0;
    };

    const productUrl = `${SITE.url.replace(/\/$/, "")}/product/${product.slug}`;
    const image = product.images[0]?.url ? absoluteUrl(product.images[0].url) : null;

    let sent = 0;
    for (const alert of pending) {
      if (!isAvailable(alert.variantId)) continue;
      const result = await sendBackInStock({
        to: alert.email,
        productName: product.name,
        productUrl,
        image,
      });
      if (result.ok) {
        await prisma.stockAlert
          .update({ where: { id: alert.id }, data: { notifiedAt: new Date() } })
          .catch(() => undefined);
        sent += 1;
      }
    }
    return sent;
  } catch (error) {
    logger.error("stock_alerts.notify_failed", {
      productId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

export function pendingStockAlertCount(productId: string): Promise<number> {
  return prisma.stockAlert.count({ where: { productId, notifiedAt: null } });
}
