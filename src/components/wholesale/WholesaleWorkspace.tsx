"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Minus, Plus, Send, ShoppingCart, ShoppingBag, Trash2, X } from "lucide-react";
import { formatKES } from "@/lib/utils";

export type WholesaleProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  categoryName: string;
  categorySlug: string;
  image: string | null;
  inStock: boolean;
};

type EnquiryItem = { productId: string; name: string; quantity: number };

export function WholesaleWorkspace({
  products,
  categories,
  whatsappHref,
}: {
  products: WholesaleProduct[];
  categories: { name: string; slug: string }[];
  whatsappHref: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [items, setItems] = useState<EnquiryItem[]>([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    organisation: "",
    location: "",
    budget: "",
    details: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [cartBusy, setCartBusy] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const router = useRouter();

  /** Adds the selected quantity straight to the shopping cart, like store cards do. */
  async function quickAddToCart(product: WholesaleProduct) {
    if (cartBusy) return;
    setCartBusy(product.id);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: Math.max(1, Math.round(Number(quantities[product.id]) || 1)) }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("zed:open-cart"));
        router.refresh();
      }
    } finally {
      setCartBusy(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.categorySlug !== category) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q);
    });
  }, [products, query, category]);

  const estimate = useMemo(
    () => items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? sum + product.price * item.quantity : sum;
    }, 0),
    [items, products],
  );

  const whatsappMessage = useMemo(() => {
    const lines = items.map((i) => `- ${i.quantity} x ${i.name}`);
    const body = lines.length ? lines.join("\n") : "(my bulk product list)";
    return encodeURIComponent(`Hi ZED GIFT SHOP, I'd like a wholesale quotation for:\n${body}\n\nMy details:`);
  }, [items]);

  function setQty(productId: string, raw: string, stockMax?: number) {
    const n = Math.max(1, Math.min(stockMax ? stockMax * 10 : 100000, Math.round(Number(raw) || 1)));
    setQuantities((current) => ({ ...current, [productId]: n }));
  }

  function bumpQty(productId: string, delta: number) {
    setQuantities((current) => ({
      ...current,
      [productId]: Math.max(1, Math.min(100000, Math.round(Number(current[productId]) || 1) + delta)),
    }));
  }

  function addItem(product: WholesaleProduct) {
    const quantity = Math.max(1, Math.round(Number(quantities[product.id]) || 1));
    setItems((current) => {
      const existing = current.find((i) => i.productId === product.id);
      if (existing) {
        return current.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...current, { productId: product.id, name: product.name, quantity }];
    });
    if (reference) setReference(null);
  }

  function updateItem(index: number, patch: Partial<EnquiryItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldError && (key === "name" || key === "phone" || key === "location")) setFieldError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!items.length) {
      setFieldError("Pick at least one product and quantity from the catalogue above.");
      return;
    }
    if (form.name.trim().length < 2 || form.location.trim().length < 2 || form.phone.replace(/\D/g, "").length < 9) {
      setFieldError("Please fill in your full name, phone number and delivery location.");
      return;
    }
    setFieldError(null);
    setServerError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/wholesale/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ productId: i.productId, name: i.name, quantity: i.quantity })),
          website: honeypot,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !data.ok) {
        setServerError(data.error ?? "Couldn't submit your request. Please try again or reach us on WhatsApp.");
        return;
      }
      setReference(data.id ?? "QS");
      setItems([]);
      setForm({ name: "", phone: "", email: "", organisation: "", location: "", budget: "", details: "" });
      setHoneypot("");
    } catch {
      setServerError("Network error - please try again or reach us on WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Catalogue toolbar */}
      <div id="wholesale-catalogue" className="scroll-mt-28 rounded-zed glass-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-[#07111F] sm:text-xl">Wholesale catalogue</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            aria-label="Search wholesale products"
            className="field"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="field sm:w-56"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-charcoal/50">
          <span>
            {filtered.length === 0 ? "No products match your search." : `${filtered.length} product${filtered.length === 1 ? "" : "s"} available in bulk.`}
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
            Order more than 10 pieces for discount
          </span>
        </p>
      </div>

      {/* Products grid */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((product) => {
          const added = items.some((i) => i.productId === product.id);
          return (
            <div key={product.id} className="glass-card flex gap-3 rounded-zed p-3">
              <div className="size-24 shrink-0 sm:size-28">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.name} className="size-full rounded-xl border border-edge object-cover" />
                ) : (
                  <div className="grid size-full place-items-center rounded-xl bg-rose-50 text-rose-400">ZED</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${product.slug}`} className="block truncate text-sm font-bold text-[#07111F] hover:text-rose-600">
                  {product.name}
                </Link>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">{product.categoryName}</p>
                <p className="text-sm font-bold text-charcoal-950">{formatKES(product.price)}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex min-h-9 items-center overflow-hidden rounded-md border border-edge">
                    <button type="button" onClick={() => bumpQty(product.id, -1)} aria-label={`Decrease quantity for ${product.name}`} className="grid size-8 place-items-center text-charcoal/60 hover:bg-panel">
                      <Minus className="size-3" />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={quantities[product.id] ?? 1}
                      onChange={(e) => setQty(product.id, e.target.value)}
                      aria-label={`Quantity of ${product.name}`}
                      className="w-12 border-x border-edge bg-transparent py-1 text-center text-sm font-semibold outline-none"
                    />
                    <button type="button" onClick={() => bumpQty(product.id, 1)} aria-label={`Increase quantity for ${product.name}`} className="grid size-8 place-items-center text-charcoal/60 hover:bg-panel">
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => quickAddToCart(product)}
                    disabled={cartBusy !== null}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-deep-olive px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-zed-900 disabled:opacity-60"
                  >
                    {cartBusy === product.id ? <Loader2 className="size-3.5 animate-spin" /> : <ShoppingCart className="size-3.5" />}
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => addItem(product)}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-bold shadow-sm transition-colors ${
                      added ? "bg-emerald-50 text-emerald-700" : "bg-white text-[#334155] border border-edge hover:border-charcoal/25"
                    }`}
                  >
                    {added ? <Check className="size-3.5" /> : <ShoppingBag className="size-3.5" />}
                    {added ? "In quote" : "Quote"}
                  </button>
                </div>
                <p className={`mt-1.5 text-[11px] font-medium ${product.inStock ? "text-emerald-600" : "text-amber-600"}`}>
                  {product.inStock ? "In stock - bulk supply confirmed per quote" : "Availability confirmed with your quote"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enquiry + quotation form */}
      <div id="wholesale-quote" className="scroll-mt-28 mt-8">
        <div className="glass-card rounded-zed p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-[#07111F] sm:text-xl">Request a wholesale quotation</h2>
            <a
              href={`${whatsappHref}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Send enquiry on WhatsApp
            </a>
          </div>

          {items.length > 0 && (
            <div className="mt-4 rounded-zed border border-edge bg-panel/40 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-soft-sage">Your bulk list ({items.length})</p>
              <ul className="mt-2 space-y-2">
                {items.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <li key={item.productId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate font-medium text-[#07111F]">{item.name}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
                          aria-label={`Quantity of ${item.name}`}
                          className="w-16 rounded-md border border-edge bg-white px-2 py-1 text-center text-sm"
                        />
                        {product && <span className="text-[11px] text-charcoal/45">{formatKES(product.price * item.quantity)}</span>}
                        <button type="button" onClick={() => removeItem(index)} aria-label={`Remove ${item.name}`} className="grid size-7 place-items-center rounded-md text-charcoal/50 hover:bg-rose-50 hover:text-rose-600">
                          <X className="size-3.5" />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 border-t border-edge pt-2 text-[11px] text-charcoal/50">
                Estimated at retail: {formatKES(estimate)}. Wholesale pricing is confirmed with your quote.
              </p>
            </div>
          )}

          {reference ? (
            <div className="mt-4 rounded-zed border border-emerald-200 bg-emerald-50 p-4" role="status">
              <p className="text-sm font-bold text-emerald-800">Request received. Reference {reference}</p>
              <p className="mt-1 text-sm text-emerald-700">We will confirm availability, wholesale pricing and delivery with you by phone or WhatsApp.</p>
              <p className="mt-1 text-xs text-emerald-600">Need to add more? Rebuild your list above and submit again.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
              <div>
                <label className="label" htmlFor="wq-name">Full name *</label>
                <input id="wq-name" className="field" value={form.name} onChange={(e) => setField("name", e.target.value)} autoComplete="name" />
              </div>
              <div>
                <label className="label" htmlFor="wq-phone">Phone number *</label>
                <input id="wq-phone" className="field" value={form.phone} onChange={(e) => setField("phone", e.target.value)} inputMode="tel" placeholder="+254 7xx xxx xxx" autoComplete="tel" />
              </div>
              <div>
                <label className="label" htmlFor="wq-email">Email (optional)</label>
                <input id="wq-email" type="email" className="field" value={form.email} onChange={(e) => setField("email", e.target.value)} autoComplete="email" />
              </div>
              <div>
                <label className="label" htmlFor="wq-org">Business or organisation (optional)</label>
                <input id="wq-org" className="field" value={form.organisation} onChange={(e) => setField("organisation", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="wq-budget">Estimated budget, KSh (optional)</label>
                <input id="wq-budget" type="number" min={0} className="field" value={form.budget} onChange={(e) => setField("budget", e.target.value)} placeholder="e.g. 50000" />
              </div>
              <div>
                <label className="label" htmlFor="wq-location">Delivery location *</label>
                <input id="wq-location" className="field" value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="County, town or estate" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="wq-details">Additional requirements or customisation (optional)</label>
                <textarea id="wq-details" className="field min-h-20 py-3" value={form.details} onChange={(e) => setField("details", e.target.value)} placeholder="Branding, packaging, delivery preferences..." />
              </div>
              <div aria-hidden="true" hidden>
                <label htmlFor="wq-website">Website</label>
                <input id="wq-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>

              {fieldError && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{fieldError}</p>}
              {serverError && <p className="rounded-zed bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{serverError}</p>}
              {!items.length && !fieldError && (
                <p className="text-xs text-charcoal/50 sm:col-span-2">Products you add below the catalogue appear here. Quantities per product are required.</p>
              )}
              <p className="rounded-zed bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 sm:col-span-2">
                Tip: order more than 10 pieces to qualify for the wholesale discount.
              </p>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-zed bg-deep-olive px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-glass transition-colors hover:bg-zed-900 disabled:opacity-50 sm:col-span-2"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Submit quotation request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
