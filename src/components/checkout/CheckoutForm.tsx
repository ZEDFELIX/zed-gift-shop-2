"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, HelpCircle, Loader2, Lock, Phone, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { formatKES } from "@/lib/utils";
import { SurpriseToggle } from "@/components/product/SurpriseToggle";

type CartView = {
 id: string;
 count: number;
 itemCount: number;
 items: {
 id: string;
 productId: string;
 slug: string;
 name: string;
 image: string | null;
 price: number;
 compareAt: number | null;
 quantity: number;
 lineTotal: number;
 giftWrapPrice: number;
 variant: { id: string; name: string; value: string } | null;
 savedForLater: boolean;
 inStock: boolean;
 }[];
 subtotal: number;
 discount: number;
 total: number;
 couponCode: string | null;
 couponInvalid: boolean;
};

type DeliveryOption = {
 method: "SAME_DAY" | "NEXT_DAY" | "STANDARD" | "EXPRESS" | "PICKUP";
 label: string;
 description: string;
 fee: number;
 eta: string;
 available: boolean;
 pickup?: boolean;
};

type UserPrefill = { name: string; email: string; phone: string } | null;

const methods: Record<DeliveryOption["method"], string> = {
 SAME_DAY: "Same-day",
 NEXT_DAY: "Next-day",
 STANDARD: "Standard",
 EXPRESS: "Express",
 PICKUP: "Pickup",
};

export function CheckoutForm({
 initialCart,
 counties,
 user,
 sitePhone,
}: {
 initialCart: CartView;
 counties: string[];
 user: UserPrefill;
 sitePhone: string;
}) {
 const router = useRouter();
 const [cart, setCart] = useState<CartView>(initialCart);
const [form, setForm] = useState({
  name: user?.name ?? "",
  email: user?.email ?? "",
  phone: user?.phone ?? "",
  county: "",
  town: "",
  area: "",
  street: "",
  address: "",
  building: "",
  apartment: "",
  landmark: "",
  instructions: "",
  deliveryMethod: "",
  isGift: false,
  });
const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [step, setStep] = useState<"form" | "review" | "processing" | "stk" | "polling" | "flutterwave" | "failed" | "assistance" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<{ orderId: string; orderNumber: string; pollToken: string } | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [pollSeconds, setPollSeconds] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"M_PESA" | "FLUTTERWAVE">("M_PESA");
  const [pushSent, setPushSent] = useState(false);
  const [failedMethod, setFailedMethod] = useState<"M_PESA" | "FLUTTERWAVE">("M_PESA");
  const [retrying, setRetrying] = useState(false);
  const [flutterwaveUrl, setFlutterwaveUrl] = useState<string | null>(null);
  const [flutterwaveTxRef, setFlutterwaveTxRef] = useState<string | null>(null);
  const pollRef = useRef(0);

 const deliveryOptions = useMemo(() => options, [options]);

 async function fetchDelivery(county: string) {
 if (!county) {
 setOptions([]);
 return;
 }
 try {
 const res = await fetch(`/api/delivery?county=${encodeURIComponent(county)}`);
 const data = (await res.json()) as { options?: DeliveryOption[] };
 setOptions(data.options ?? []);
 if (!form.deliveryMethod && data.options?.[0]) {
 setForm((f) => ({ ...f, deliveryMethod: data.options![0].method }));
 }
 } catch {
 setOptions([]);
 }
 }

 async function placeOrder() {
 setError(null);
 setStep("processing");
 try {
 const res = await fetch("/api/orders", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: form.name,
 email: form.email,
 phone: form.phone,
county: form.county,
  town: form.town,
  area: form.area,
  street: form.street,
  address: form.address,
  building: form.building,
  apartment: form.apartment,
  landmark: form.landmark,
  instructions: form.instructions,
  deliveryMethod: form.deliveryMethod,
  isGift: form.isGift,
  paymentMethod,
  }),
 });
const data = (await res.json()) as {
ok?: boolean;
   error?: string;
   configured?: boolean;
   pollToken?: string;
   total?: number;
   orderId?: string;
   orderNumber?: string;
  payment?: {
  status?: string;
  error?: string;
  configured?: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  method?: string;
  txRef?: string;
  authorizationUrl?: string;
  link?: string;
  };
  };

  const configured = data.configured !== false && data.payment?.configured !== false;

  if (!res.ok && configured) {
  setError(data.error ?? "We couldn't place your order. Please try again or contact support.");
  setStep("form");
  return;
  }

  if (!data.ok && configured) {
  setError(data.error ?? "We couldn't place your order. Please try again or contact support.");
  setStep("form");
  return;
  }

  setOrderRef({ orderId: data.orderId!, orderNumber: data.orderNumber!, pollToken: data.pollToken ?? "" });
  setOrderTotal(data.total ?? null);

  if (data.configured === false || data.payment?.configured === false) {
  setError(data.error ?? data.payment?.error ?? "Payment is not configured on this store yet. Contact the shop to arrange payment.");
  setStep("assistance");
  return;
  }

  if (data.payment?.status === "FAILED") {
  const method = data.payment.method === "FLUTTERWAVE" ? "FLUTTERWAVE" : "M_PESA";
  setFailedMethod(method);
  setPushSent(false);
  setError(data.payment.error ?? null);
  setStep("failed");
  return;
  }

  // Flutterwave: redirect to authorization URL
  if (data.payment?.method === "FLUTTERWAVE" && data.payment?.authorizationUrl) {
  setFlutterwaveUrl(data.payment.authorizationUrl);
  setFlutterwaveTxRef(data.payment.txRef ?? null);
  setPushSent(true);
  setStep("flutterwave");
  return;
  }

  setPushSent(true);
  setStep("stk");
  } catch {
  setError("Network error while placing your order. Please try again.");
  setStep("form");
  }
  }

  async function retryPayment() {
  if (!orderRef || retrying) return;
  setRetrying(true);
  setError(null);
  try {
  if (failedMethod === "M_PESA") {
  const res = await fetch("/api/payments/mpesa/stk-push", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  orderId: orderRef.orderId,
  phone: form.phone,
  amount: orderTotal ?? 0,
  accountReference: orderRef.orderNumber,
  }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string; checkoutRequestId?: string };
  if (!res.ok || !data.ok) {
  setError(data.error ?? "We couldn't send the M-PESA prompt. Please try again.");
  return;
  }
  setPushSent(true);
  setStep("stk");
  } else {
  const res = await fetch("/api/payments/flutterwave", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  orderId: orderRef.orderId,
  amount: orderTotal ?? 0,
  email: form.email,
  firstName: form.name.split(" ")[0] || form.name,
  lastName: form.name.split(" ").slice(1).join(" ") || "",
  phone: form.phone,
  }),
  });
  const data = (await res.json()) as
  | { ok?: boolean; error?: string }
  | { ok?: boolean; authorizationUrl?: string; txRef?: string; error?: string };
  const d = data as { ok?: boolean; authorizationUrl?: string; txRef?: string; error?: string };
  if (!res.ok || !d.ok || !d.authorizationUrl) {
  setError(d.error ?? "We couldn't start the payment. Please try again.");
  return;
  }
  setFlutterwaveUrl(d.authorizationUrl);
  setFlutterwaveTxRef(d.txRef ?? null);
  setPushSent(true);
  setStep("flutterwave");
  }
  } catch {
  setError("Network error while retrying payment. Please try again.");
  } finally {
  setRetrying(false);
  }
  }

useEffect(() => {
  if (step !== "polling" || !orderRef) return;
  const interval = setInterval(async () => {
  pollRef.current += 1;
  setPollSeconds(pollRef.current);
  if (pollRef.current >= 180) {
  clearInterval(interval);
  pollRef.current = 0;
  setPollSeconds(0);
  setError("The M-PESA prompt may have expired. You can send it again below.");
  setStep("stk");
  return;
  }
  try {
  const res = await fetch(`/api/orders/${orderRef.orderId}/status`, {
  headers: { "x-order-token": orderRef.pollToken },
  });
  const data = (await res.json()) as { paymentStatus?: string; mpesaReceipt?: string | null; paymentResultDescription?: string | null };
  if (data.paymentStatus === "SUCCESSFUL") {
  clearInterval(interval);
  pollRef.current = 0;
  setPollSeconds(0);
  setStep("done");
  } else if (data.paymentStatus === "FAILED" || data.paymentStatus === "CANCELLED") {
  clearInterval(interval);
  pollRef.current = 0;
  setPollSeconds(0);
  setFailedMethod("M_PESA");
  setPushSent(false);
  setError(data.paymentResultDescription ?? "Payment was not completed.");
  setStep("failed");
  }
  } catch {
  // keep polling
  }
  }, 3000);
  return () => clearInterval(interval);
  }, [step, orderRef]);

// Check Flutterwave payment status periodically
  useEffect(() => {
  if (step !== "flutterwave" || !orderRef) return;
  const interval = setInterval(async () => {
  try {
  const res = await fetch(`/api/orders/${orderRef.orderId}/status`, {
  headers: { "x-order-token": orderRef.pollToken },
  });
  const data = (await res.json()) as { paymentStatus?: string };
  if (data.paymentStatus === "SUCCESSFUL") {
  clearInterval(interval);
  setStep("done");
  } else if (data.paymentStatus === "FAILED" || data.paymentStatus === "CANCELLED") {
  clearInterval(interval);
  setFailedMethod("FLUTTERWAVE");
  setPushSent(false);
  setError("Payment was not completed.");
  setStep("failed");
  }
  } catch {
  // keep polling
  }
  }, 5000);
  return () => clearInterval(interval);
  }, [step, orderRef]);

  // Auto-poll shortly after a successful STK push so users don't have to notice the button.
  useEffect(() => {
  if (step === "stk" && pushSent && orderRef) {
  const t = setTimeout(() => startPolling(), 2500);
  return () => clearTimeout(t);
  }
  }, [step, pushSent, orderRef]);

  function startPolling() {
  pollRef.current = 0;
  setPollSeconds(0);
  setStep("polling");
  }

const deliveryFee = deliveryOptions.find((o) => o.method === form.deliveryMethod)?.fee ?? 0;
  const total = Math.max(0, cart.subtotal - cart.discount) + deliveryFee;
  const phoneDigits = form.phone.replace(/\D/g, "").replace(/^00/, "");
  const phoneIsValid = /^(0|254)\d{9}$/.test(phoneDigits);
  const canSubmit =
  form.name.trim() &&
  /.+@.+\..+/.test(form.email) &&
  phoneIsValid &&
  form.county &&
  form.town.trim() &&
  form.address.trim() &&
  (form.deliveryMethod === "PICKUP" || form.deliveryMethod)
  ? true
  : false;

 function toggleReview() {
 if (step === "form") setStep("review");
 else setStep("form");
 }

 const showReview = step === "review" || step === "processing" || step === "stk" || step === "polling" || step === "flutterwave" || step === "failed" || step === "done";

 return (
 <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
 <div className="space-y-6">
 {/* Order summary banner (review step) */}
 {showReview && (
 <div className="glass-card rounded-zed p-5">
 <h2 className="font-display text-lg font-bold text-[#171717]">Order details</h2>
 <ul className="mt-3 divide-y divide-white/40 text-sm">
 {cart.items.map((i) => (
 <li key={i.id} className="flex items-center gap-3 py-2.5">
 <span className="relative block size-12 shrink-0 overflow-hidden rounded-zed bg-white/30">
 {i.image ? <Image src={i.image} alt="" fill unoptimized className="object-cover" /> : null}
 </span>
 <div className="min-w-0 flex-1">
 <p className="truncate font-medium text-[#171717]">{i.name}</p>
 <p className="text-xs text-[#6B6B6B]">
 x{i.quantity}
 {i.variant ? ` | ${i.variant.value}` : ""}
 {i.giftWrapPrice > 0 ? " | Gift box" : ""}
 </p>
 </div>
 <p className="font-semibold text-[#171717]">{formatKES(i.lineTotal)}</p>
 </li>
 ))}
 </ul>
 </div>
 )}

{/* Contact & delivery */}
  {step === "form" ? (
  <div className="glass-card rounded-zed p-5 lg:p-7">
 <h2 className="font-display text-lg font-bold text-[#171717]">Delivery details</h2>
 <div className="mt-5 grid gap-4 sm:grid-cols-2">
 <div>
 <label className="label" htmlFor="co-name">Full name</label>
 <input id="co-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" placeholder="Jane Mwangi" />
 </div>
 <div>
<label className="label" htmlFor="co-phone">M-PESA phone</label>
  <div className="relative">
  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B6B6B]" />
  <input id="co-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`field pl-9 ${form.phone && !phoneIsValid ? "border-red-400" : ""}`} placeholder="0712 345 678" inputMode="tel" autoComplete="tel-national" />
  </div>
  {form.phone && !phoneIsValid && (
  <p className="mt-1 text-xs text-red-600">Enter a Kenyan mobile number, e.g. 0712 345 678.</p>
  )}
  </div>
 <div className="sm:col-span-2">
 <label className="label" htmlFor="co-email">Email (for order updates)</label>
 <input id="co-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" placeholder="you@example.com" />
 </div>
 <div>
 <label className="label" htmlFor="co-county">County</label>
 <select id="co-county" value={form.county} onChange={(e) => { setForm({ ...form, county: e.target.value }); fetchDelivery(e.target.value); }} className="field">
 <option value="">Select county</option>
 {counties.map((c) => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>
<div>
  <label className="label" htmlFor="co-town">Town</label>
  <input id="co-town" value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} className="field" placeholder="Nairobi" />
  </div>
  <div>
  <label className="label" htmlFor="co-area">Area / estate</label>
  <input id="co-area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="field" placeholder="Kilimani" />
  </div>
  <div className="sm:col-span-2">
  <label className="label" htmlFor="co-address">Delivery address</label>
  <input id="co-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field" placeholder="House/plot no. and street" />
  </div>
  <div>
  <label className="label" htmlFor="co-street">Street (optional)</label>
  <input id="co-street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="field" />
  </div>
  <div>
  <label className="label" htmlFor="co-building">Building (optional)</label>
  <input id="co-building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} className="field" />
  </div>
  <div>
  <label className="label" htmlFor="co-apartment">Apartment (optional)</label>
  <input id="co-apartment" value={form.apartment} onChange={(e) => setForm({ ...form, apartment: e.target.value })} className="field" />
  </div>
  <div>
  <label className="label" htmlFor="co-landmark">Nearest landmark (optional)</label>
  <input id="co-landmark" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} className="field" placeholder="Opposite Kenya High School" />
  </div>
  <div className="sm:col-span-2">
  <label className="label" htmlFor="co-instructions">Delivery instructions (optional)</label>
  <textarea id="co-instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="field" rows={3} placeholder="Gate colour, best time to deliver, rider to call on arrival" />
  </div>
  </div>

 {/* Delivery method */}
 {form.county && (
 <div className="mt-6">
 <p className="label">Delivery method</p>
 {deliveryOptions.length === 0 ? (
 <p className="flex items-center gap-2 text-sm text-[#6B6B6B]">
 <Loader2 className="size-4 animate-spin" /> Checking options for {form.county}...
 </p>
 ) : (
 <div className="space-y-2">
 {deliveryOptions.map((opt) => (
 <button
 key={opt.method}
 type="button"
 onClick={() => setForm({ ...form, deliveryMethod: opt.method })}
 className={`flex w-full items-center justify-between gap-3 rounded-zed border p-3.5 text-left backdrop-blur-sm transition-colors ${form.deliveryMethod === opt.method ? "border-soft-sage bg-warm-white" : "border-white/50 bg-white/30 hover:border-soft-sage hover:bg-white/45"}`}
 >
 <div className="flex items-center gap-3">
 <span className={`grid size-5 place-items-center rounded-full border ${form.deliveryMethod === opt.method ? "border-deep-olive bg-deep-olive" : "border-white/60"}`}>
 {form.deliveryMethod === opt.method && <Check className="size-3 text-white" />}
 </span>
 <div>
 <p className="text-sm font-semibold text-[#171717]">{opt.label}</p>
 <p className="text-xs text-[#6B6B6B]">{opt.description}</p>
 </div>
 </div>
 <p className="shrink-0 text-sm font-bold text-[#171717]">{opt.fee === 0 ? "Free" : formatKES(opt.fee)}</p>
 </button>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Payment Method */}
 <div className="mt-6">
 <p className="label">Payment method</p>
 <div className="space-y-2">
 <button
 type="button"
 onClick={() => setPaymentMethod("M_PESA")}
 className={`flex w-full items-center gap-3 rounded-zed border p-3.5 text-left backdrop-blur-sm transition-colors ${paymentMethod === "M_PESA" ? "border-soft-sage bg-warm-white" : "border-white/50 bg-white/30 hover:border-soft-sage hover:bg-white/45"}`}
 >
 <div className={`grid size-5 place-items-center rounded-full border ${paymentMethod === "M_PESA" ? "border-deep-olive bg-deep-olive" : "border-white/60"}`}>
 {paymentMethod === "M_PESA" && <Check className="size-3 text-white" />}
 </div>
 <div>
 <p className="text-sm font-semibold text-[#171717]">M-PESA STK Push</p>
 <p className="text-xs text-[#6B6B6B]">Pay instantly with your phone via M-PESA</p>
 </div>
 </button>
 <button
 type="button"
 onClick={() => setPaymentMethod("FLUTTERWAVE")}
 className={`flex w-full items-center gap-3 rounded-zed border p-3.5 text-left backdrop-blur-sm transition-colors ${paymentMethod === "FLUTTERWAVE" ? "border-soft-sage bg-warm-white" : "border-white/50 bg-white/30 hover:border-soft-sage hover:bg-white/45"}`}
 >
 <div className={`grid size-5 place-items-center rounded-full border ${paymentMethod === "FLUTTERWAVE" ? "border-deep-olive bg-deep-olive" : "border-white/60"}`}>
 {paymentMethod === "FLUTTERWAVE" && <Check className="size-3 text-white" />}
 </div>
 <div>
 <p className="text-sm font-semibold text-[#171717]">Card / Mobile Money</p>
 <p className="text-xs text-[#6B6B6B]">Pay with card or M-PESA via Flutterwave</p>
 </div>
 </button>
 </div>
 </div>

 {/* Gift flag */}
 <div className="mt-6 flex items-start gap-3 rounded-zed glass-panel/70 p-4 backdrop-blur-sm">
 <Sparkles className="mt-0.5 size-5 shrink-0 text-soft-sage" />
 <div>
 <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#171717]">
 <input type="checkbox" checked={form.isGift} onChange={(e) => setForm({ ...form, isGift: e.target.checked })} className="size-4 accent-deep-olive" />
 This is a gift
 </label>
 <p className="mt-1 text-xs text-[#171717]">We&apos;ll wrap it beautifully and hide all pricing from the delivery slip.</p>
 </div>
 </div>

 {/* Surprise Mode */}
 <div className="mt-6">
 <SurpriseToggle />
 </div>

 {error && step === "form" && (
 <p className="mt-4 rounded-zed bg-red-50/70 px-4 py-3 text-sm text-red-700 backdrop-blur-sm">{error}</p>
 )}

<button
  type="button"
  disabled={!canSubmit}
  onClick={toggleReview}
  className="mt-6 w-full rounded-zed bg-zed-950 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-zed-900 disabled:cursor-not-allowed disabled:opacity-40"
  >
  Review order
  </button>
  </div>
  ) : null}

  {/* Review: read-only summary with the actual order-placing button */}
  {step === "review" && (
  <div className="glass-card rounded-zed p-5 lg:p-7">
  <h2 className="font-display text-lg font-bold text-[#171717]">Check your details</h2>

  <dl className="mt-4 divide-y divide-white/40 text-sm">
  <div className="flex items-start justify-between gap-4 py-2.5">
  <dt className="text-[#6B6B6B]">Contact</dt>
  <dd className="text-right font-medium text-[#171717]">
  {form.name}
  <br />
  {form.phone}
  <br />
  {form.email}
  </dd>
  </div>
  <div className="flex items-start justify-between gap-4 py-2.5">
  <dt className="text-[#6B6B6B]">Deliver to</dt>
  <dd className="text-right font-medium text-[#171717]">
  {[form.area, form.town, form.county].filter(Boolean).join(", ")}
  <br />
  {[form.address, form.street, form.building, form.apartment].filter(Boolean).join(", ")}
  {form.landmark ? (
  <>
  <br />
  <span className="text-xs text-[#6B6B6B]">Near {form.landmark}</span>
  </>
  ) : null}
  </dd>
  </div>
  {form.instructions.trim() && (
  <div className="flex items-start justify-between gap-4 py-2.5">
  <dt className="text-[#6B6B6B]">Instructions</dt>
  <dd className="max-w-[60%] text-right font-medium text-[#171717]">{form.instructions}</dd>
  </div>
  )}
  <div className="flex items-start justify-between gap-4 py-2.5">
  <dt className="text-[#6B6B6B]">Delivery</dt>
  <dd className="text-right font-medium text-[#171717]">
  {(methods as Record<string, string>)[form.deliveryMethod] ?? form.deliveryMethod}
  <br />
  <span className="text-xs text-[#6B6B6B]">
  {deliveryOptions.find((o) => o.method === form.deliveryMethod)?.eta}
  </span>
  </dd>
  </div>
  <div className="flex items-start justify-between gap-4 py-2.5">
  <dt className="text-[#6B6B6B]">Payment</dt>
  <dd className="text-right font-medium text-[#171717]">
  {paymentMethod === "FLUTTERWAVE" ? "Card / Mobile Money" : "M-PESA STK Push"}
  </dd>
  </div>
  </dl>

  {error && (
  <p className="mt-4 rounded-zed bg-red-50/70 px-4 py-3 text-sm text-red-700 backdrop-blur-sm">{error}</p>
  )}

  <button
  type="button"
  onClick={placeOrder}
  className="mt-6 w-full rounded-zed bg-zed-950 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-zed-900"
  >
  Place order &amp; pay {formatKES(total)}
  </button>
  <button
  type="button"
  onClick={toggleReview}
  className="mt-2 w-full rounded-zed border border-white/60 py-3 text-sm font-semibold text-[#171717] transition-colors hover:bg-white/40"
  >
  Back to edit details
  </button>
  <p className="mt-3 text-center text-[11px] leading-relaxed text-[#6B6B6B]">
  By placing this order you agree to our delivery &amp; returns policy.
  </p>
  </div>
  )}

{/* STK + polling + Flutterwave + failure + assistance states */}
  {(step === "stk" || step === "polling" || step === "flutterwave" || step === "failed" || step === "assistance") && orderRef && (
  <div className="glass-card rounded-zed p-6 text-center">
  <span className="glass-strong mx-auto grid size-14 place-items-center rounded-full text-deep-olive">
  {step === "polling" || step === "flutterwave" ? (
  <Loader2 className="size-7 animate-spin" />
  ) : step === "failed" ? (
  <RefreshCw className="size-7" />
  ) : step === "assistance" ? (
  <Phone className="size-7" />
  ) : (
  <Phone className="size-7" />
  )}
  </span>

  {step === "flutterwave" ? (
  <>
  <h2 className="mt-4 font-display text-xl font-bold text-[#171717]">Complete your payment</h2>
  {flutterwaveUrl && (
  <a href={flutterwaveUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-zed bg-zed-950 px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-white hover:shadow-glass-lg">
  Pay with Flutterwave
  </a>
  )}
  <p className="mx-auto mt-4 max-w-sm text-sm text-[#6B6B6B]">
  You&apos;ll be redirected to Flutterwave to complete payment. We&apos;ll check for confirmation automatically.
  </p>
  <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
  <button type="button" onClick={retryPayment} disabled={retrying} className="flex items-center gap-2 text-sm text-[#6B6B6B] underline-offset-2 hover:underline disabled:opacity-50">
  {retrying ? <Loader2 className="size-4 animate-spin" /> : null} Reopen the payment window
  </button>
  <button type="button" onClick={() => router.push(`/track?order=${orderRef.orderNumber}`)} className="text-sm text-[#6B6B6B] underline-offset-2 hover:underline">
  I&apos;ll track it later
  </button>
  </div>
  {error && <p className="mx-auto mt-4 max-w-sm rounded-zed bg-red-50/70 px-4 py-2.5 text-sm text-red-700 backdrop-blur-sm">{error}</p>}
  </>
  ) : step === "stk" ? (
  <>
  <h2 className="mt-4 font-display text-xl font-bold text-[#171717]">{pushSent ? "Check your phone" : "We couldn&apos;t send the prompt"}</h2>
  <p className="mx-auto mt-2 max-w-sm text-sm text-[#6B6B6B]">
  {pushSent ? (
  <>
  We&apos;ve sent an <strong>M-PESA STK push</strong> to <strong>{form.phone}</strong> for{" "}
  <strong>{formatKES(orderTotal ?? total)}</strong>. Enter your M-PESA PIN to approve.
  </>
  ) : (
  error ?? "We couldn&apos;t start the M-PESA payment. Send the prompt again below."
  )}
  </p>
  <p className="mt-2 text-xs text-[#6B6B6B]">Order {orderRef.orderNumber}</p>
  <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
  {pushSent ? (
  <button type="button" onClick={startPolling} className="rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white">
  I&apos;ve entered my PIN
  </button>
  ) : (
  <button type="button" onClick={retryPayment} disabled={retrying} className="flex items-center justify-center gap-2 rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
  {retrying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Send prompt again
  </button>
  )}
  <button type="button" onClick={retryPayment} disabled={retrying} className="flex items-center gap-2 text-sm text-[#6B6B6B] underline-offset-2 hover:underline disabled:opacity-50">
  {retrying ? <Loader2 className="size-4 animate-spin" /> : null} Prompt didn&apos;t arrive? Send it again
  </button>
  <button type="button" onClick={() => router.push(`/track?order=${orderRef.orderNumber}`)} className="text-sm text-[#6B6B6B] underline-offset-2 hover:underline">
  I&apos;ll track it later
  </button>
  </div>
  {error && pushSent && <p className="mx-auto mt-4 max-w-sm rounded-zed bg-red-50/70 px-4 py-2.5 text-sm text-red-700 backdrop-blur-sm">{error}</p>}
  </>
  ) : step === "polling" ? (
  <>
  <h2 className="mt-4 font-display text-xl font-bold text-[#171717]">Waiting for confirmation</h2>
  <p className="mx-auto mt-2 max-w-sm text-sm text-[#6B6B6B]">
  Waiting for payment confirmation{pollSeconds >= 5 ? ` (${pollSeconds}s...)` : "..."}
  </p>
  <p className="mt-4 text-xs text-[#6B6B6B]">Approve the prompt on your phone with your M-PESA PIN.</p>
  <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
  <button type="button" onClick={retryPayment} disabled={retrying} className="flex items-center gap-2 text-sm text-[#6B6B6B] underline-offset-2 hover:underline disabled:opacity-50">
  {retrying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Prompt didn&apos;t arrive? Send it again
  </button>
  <button type="button" onClick={() => router.push(`/track?order=${orderRef.orderNumber}`)} className="text-sm text-[#6B6B6B] underline-offset-2 hover:underline">
  I&apos;ll track it later
  </button>
  </div>
  {error && <p className="mx-auto mt-4 max-w-sm rounded-zed bg-red-50/70 px-4 py-2.5 text-sm text-red-700 backdrop-blur-sm">{error}</p>}
  </>
  ) : step === "failed" ? (
  <>
  <h2 className="mt-4 font-display text-xl font-bold text-[#171717]">Payment didn&apos;t go through</h2>
  <p className="mx-auto mt-2 max-w-sm text-sm text-[#6B6B6B]">
  {error ?? (failedMethod === "M_PESA" ? "The M-PESA payment wasn&apos;t completed." : "The payment wasn&apos;t completed.")} Your order <strong>{orderRef.orderNumber}</strong> is saved and you can try again.
  </p>
  <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
  <button type="button" onClick={retryPayment} disabled={retrying} className="flex items-center justify-center gap-2 rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
  {retrying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} {failedMethod === "M_PESA" ? "Try M-PESA again" : "Try payment again"}
  </button>
  <button type="button" onClick={() => router.push(`/track?order=${orderRef.orderNumber}`)} className="text-sm text-[#6B6B6B] underline-offset-2 hover:underline">
  I&apos;ll pay later
  </button>
  </div>
  </>
  ) : (
  <>
  <h2 className="mt-4 font-display text-xl font-bold text-[#171717]">Order saved - payment needs a hand</h2>
  <p className="mx-auto mt-2 max-w-sm text-sm text-[#6B6B6B]">
  We&apos;ve saved order <strong>{orderRef.orderNumber}</strong>, but {error ? error.toLowerCase() : "payments aren&apos;t available on this store right now"}. We&apos;ve reserved your items - get in touch to complete payment.
  </p>
  <p className="mt-3 text-sm font-semibold text-[#171717]">{sitePhone}</p>
  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
  <button type="button" onClick={() => router.push(`/track?order=${orderRef.orderNumber}`)} className="rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white">
  Track order
  </button>
  <button type="button" onClick={() => router.push("/shop")} className="glass-panel rounded-zed px-6 py-3 text-sm font-semibold text-[#171717] hover:text-deep-olive">
  Continue shopping
  </button>
  </div>
  </>
  )}
  </div>
  )}

 {step === "done" && orderRef && (
 <div className="glass-card rounded-zed p-6 text-center">
 <span className="mx-auto grid size-14 place-items-center rounded-full bg-zed-950 text-white">
 <Check className="size-7" />
 </span>
 <h2 className="mt-4 font-display text-xl font-bold text-[#171717]">Thanks for your order!</h2>
 <p className="mt-2 text-sm text-[#6B6B6B]">
 Order <strong>{orderRef.orderNumber}</strong> is confirmed and being prepared.
 {error && <span className="mt-2 block text-red-600">{error}</span>}
 </p>
 <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
 <button type="button" onClick={() => router.push(`/checkout/success?order=${orderRef.orderNumber}`)} className="rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white">
 View order summary
 </button>
 <button type="button" onClick={() => router.push("/shop")} className="glass-panel rounded-zed px-6 py-3 text-sm font-semibold text-[#171717] hover:text-deep-olive">
 Keep shopping
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Totals */}
 <aside className="lg:sticky lg:top-24 lg:self-start">
 <div className="glass-card rounded-zed p-5">
 <p className="font-display text-lg font-bold text-[#171717]">Summary</p>
 <ul className="mt-4 max-h-64 space-y-2.5 overflow-y-auto text-sm">
 {cart.items.map((i) => (
 <li key={i.id} className="flex items-center justify-between gap-3">
 <span className="truncate text-[#171717]">
 {i.name.slice(0, 42)}
 <span className="text-[#6B6B6B]"> x{i.quantity}</span>
 </span>
 <span className="shrink-0 font-medium">{formatKES(i.lineTotal)}</span>
 </li>
 ))}
 </ul>
 <dl className="mt-4 space-y-1.5 border-t border-white/40 pt-4 text-sm">
 <div className="flex justify-between text-[#171717]">
 <dt>Subtotal</dt>
 <dd>{formatKES(cart.subtotal)}</dd>
 </div>
 {cart.discount > 0 && (
 <div className="flex justify-between font-semibold text-deep-olive">
 <dt className="flex items-center gap-1">
 Coupon {cart.couponCode} <HelpCircle className="size-3.5" />
 </dt>
 <dd>-{formatKES(cart.discount)}</dd>
 </div>
 )}
 <div className="flex justify-between text-[#171717]">
 <dt>Delivery {form.deliveryMethod ? `(${(methods as Record<string, string>)[form.deliveryMethod]})` : ""}</dt>
 <dd>{deliveryFee === 0 ? "Free" : formatKES(deliveryFee)}</dd>
 </div>
 <div className="flex justify-between border-t border-white/40 pt-3 text-base font-bold text-[#171717]">
 <dt>Total</dt>
 <dd>{formatKES(total)}</dd>
 </div>
 </dl>
 <div className="glass-panel mt-4 rounded-zed px-3.5 py-3 text-xs text-[#6B6B6B]">
 <span className="flex items-center gap-1.5 font-semibold text-[#171717]">
 <ShieldCheck className="size-3.5" /> {paymentMethod === "FLUTTERWAVE" ? "Paid via Flutterwave" : "Paid via M-PESA STK Push"}
 </span>
 <p className="mt-1">{paymentMethod === "FLUTTERWAVE" ? "Pay securely with card or mobile money." : "You approve with your M-PESA PIN - no card details on the site. Refunds are processed via M-PESA."}</p>
 </div>
 <p className="mt-3 text-[11px] leading-relaxed text-[#6B6B6B]">
 Need help? WhatsApp {sitePhone}. By placing this order you agree to our delivery &amp; returns policy.
 </p>
 </div>
 </aside>
 </div>
 );
}