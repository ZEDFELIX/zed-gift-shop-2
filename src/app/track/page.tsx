"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, PackageSearch, Search, Truck } from "lucide-react";
import { formatKES } from "@/lib/utils";
import { ORDER_STATUS_STEPS } from "@/lib/constants";

type TrackedOrder = {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  total: number;
  county: string;
  town: string;
  deliveryMethod: string;
  isGift: boolean;
  email: string;
  items: { name: string; quantity: number; price: number; giftWrapPrice: number; image: string | null }[];
};

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="container-zed max-w-2xl py-20 text-center text-sm text-charcoal/50">Loading...</div>}>
      <TrackContent />
    </Suspense>
  );
}

function TrackContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") ?? "";
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [orderKey, setOrderKey] = useState("");
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, orderKey }),
      });
      const data = (await res.json()) as { error?: string } & TrackedOrder;
      if (!res.ok) {
        setError(data.error ?? "No order found.");
      } else {
        const tracked: TrackedOrder = {
          orderNumber: data.orderNumber,
          orderStatus: data.orderStatus,
          paymentStatus: data.paymentStatus,
          createdAt: data.createdAt,
          total: data.total,
          county: data.county,
          town: data.town,
          deliveryMethod: data.deliveryMethod,
          isGift: data.isGift,
          email: data.email,
          items: data.items,
        };
        setResult(tracked);
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const steps = ORDER_STATUS_STEPS.map((s) => s.status);
  const currentIndex = steps.indexOf(result?.orderStatus ?? "");
  const paid = result?.paymentStatus === "SUCCESSFUL";

  return (
    <div className="container-zed max-w-2xl py-14 lg:py-20">
      <header className="text-center">
        <p className="eyebrow text-rose-500">Where's my gift?</p>
        <h1 className="mt-2 font-display text-3xl lg:text-5xl font-bold text-charcoal lg:text-6xl">
          Track your order
        </h1>
        <p className="mt-2 text-sm text-charcoal/500">
          Enter the order number and the email or phone you used at checkout.
        </p>
      </header>

      <form onSubmit={lookup} className="glass-card mt-8 rounded-xl p-6">
        <div>
          <label className="label text-sm uppercase tracking-wider text-charcoal/40 mb-2">
            Order number
          </label>
          <input
            id="t-number"
            className="field border border-charcoal/20 rounded-xl bg-white/20 px-4 py-3 placeholder-charcoal/40"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            placeholder="ZED-XXXXXX"
          />
        </div>
        <div>
          <label className="label text-sm uppercase tracking-wider text-charcoal/40 mb-2">
            Email or phone
          </label>
          <input
            id="t-key"
            className="field border border-charcoal/20 rounded-xl bg-white/20 px-4 py-3 placeholder-charcoal/40"
            value={orderKey}
            onChange={(e) => setOrderKey(e.target.value)}
            required
            placeholder="you@example.com or 0712..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-rose-500 py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Search className="size-4" />
          )}
          Track order
        </button>
        {error && (
          <p className="mt-3 rounded-xl bg-rose-50/70 px-4 py-3 text-sm text-rose-600 backdrop-blur-sm">
            {error}
          </p>
        )}
      </form>

      {result && (
        <section className="mt-8">
          <div className="glass-card rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg font-bold text-charcoal">
                  # {result.orderNumber}
                </p>
                <p className="text-xs text-charcoal/500">
                  Placed{" "}
                  {new Date(result.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}|
                  {result.county}, {result.town}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-charcoal/400">Total</p>
                <p className="font-bold text-charcoal">{formatKES(result.total)}</p>
                <p
                  className={`
                    text-xs font-semibold
                    ${paid ? "text-rose-600" : "text-amber-500"}
                  `}
                >
                  {paid ? "Paid via M-PESA" : "Awaiting payment"}
                </p>
              </div>
            </div>
            {!paid && (
              <p className="mt-3 rounded-xl bg-rose-50/70 px-4 py-3 text-sm text-rose-600 backdrop-blur-sm">
                This order isn't paid yet. Complete the M-PESA prompt on your phone or contact{" "}<span className="font-semibold text-rose-500">
                  +254 711 436169
                </span> to help complete it.
              </p>
            )}

            <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {steps.map((s, i) => (
                <li
                  key={s}
                  className={`relative rounded-xl border ${i <= currentIndex ? "border-rose-200 bg-rose-50" : "border-white/30 bg-white/30 text-charcoal"}`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">
                    {ORDER_STATUS_STEPS[i].label}
                  </span>
                  {i <= currentIndex && <span className="mt-1 block size-2 rounded-full bg-rose-100" />}
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <h2 className="font-display text-base font-bold text-charcoal">Your items</h2>
            <ul className="mt-3 divide-y divide-charcoal/10">
              {result.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 py-3">
                  <span className="relative block size-12 shrink-0 overflow-hidden rounded-xl glass-panel">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal">{item.name}</p>
                    <p className="text-xs text-charcoal/400">
                      Qty {item.quantity}{item.giftWrapPrice > 0 ? " | Gift wrap" : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-charcoal">
                    {formatKES((item.price + item.giftWrapPrice) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-center text-sm text-charcoal/400">
            Need help? WhatsApp{" "}<a className="font-semibold text-rose-400 underline" href="tel:+254711436169">
              +254 711 436169
            </a> with your order number.
          </p>
        </section>
      )}

      {!result && !error && (
        <div className="mt-10 flex flex-col items-center text-center text-sm text-charcoal/400">
          <PackageSearch className="mb-2 size-10 text-rose-300/50" />
          <p>
            New to ZED?{" "}<Link href="/shop" className="text-rose-300 underline underline-offset-2">
              Explore the gift shop
            </Link>
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-charcoal/400">
          Order{" "}{result?.orderNumber ?? ""} is being prepared.
        </p>
      </div>
    </div>
  );
}