"use client";

/**
 * Footer is a server component, so the "View Cart" entry is a tiny client
 * island that dispatches the same event the header cart button uses.
 */
export function OpenCartLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("zed:open-cart"))}
      className={className ?? "text-left transition-colors hover:text-white"}
    >
      View Cart
    </button>
  );
}
