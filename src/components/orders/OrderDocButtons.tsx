"use client";

import { useEffect, useState } from "react";
import { FileText, ReceiptText } from "lucide-react";

const linkClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-zed border border-edge bg-white/60 px-3.5 py-2 text-xs font-bold text-[#07111F] transition-colors hover:border-soft-sage";

/**
 * Invoice / receipt PDF download links for an order.
 *
 * Signed-in owners and staff are authorized by session cookie. Guests who just
 * checked out carry a short-lived order token in this tab's session storage
 * (saved at order creation); it is appended when present.
 */
export function OrderDocButtons({
  orderId,
  isPaid,
  compact = false,
}: {
  orderId: string;
  isPaid: boolean;
  compact?: boolean;
}) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      setToken(sessionStorage.getItem(`zed:order-token:${orderId}`));
    } catch {
      setToken(null);
    }
  }, [orderId]);

  const suffix = token ? `?token=${encodeURIComponent(token)}` : "";
  return (
    <span className={compact ? "inline-flex flex-wrap gap-1.5" : "inline-flex flex-wrap gap-2"}>
      <a href={`/api/orders/${orderId}/invoice${suffix}`} className={linkClass} download>
        <FileText className="size-3.5" /> Invoice PDF
      </a>
      {isPaid && (
        <a href={`/api/orders/${orderId}/receipt${suffix}`} className={linkClass} download>
          <ReceiptText className="size-3.5" /> Receipt PDF
        </a>
      )}
    </span>
  );
}

export function rememberOrderToken(orderId: string, token: string) {
  try {
    if (orderId && token) sessionStorage.setItem(`zed:order-token:${orderId}`, token);
  } catch {
    // Private browsing etc. - downloads still work for signed-in owners.
  }
}
