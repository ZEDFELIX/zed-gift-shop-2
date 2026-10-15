import Link from "next/link";
import { getOrderByNumber, ORDER_STATUS_STEPS } from "@/lib/data/orders";
import { formatKES } from "@/lib/utils";
import { CheckCircle2, Package, QrCode } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order confirmed", robots: { index: false } };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
 const { order } = await searchParams;
 const data = order ? await getOrderByNumber(order) : null;

 if (!data) {
 return (
 <div className="container-zed py-24 text-center">
 <h1 className="font-display text-2xl font-bold text-[#07111F]">Order not found</h1>
 <p className="mt-2 text-[#334155]">We couldn&apos;t find that order. Check your email or visit track order.</p>
 <Link href="/track" className="mt-6 inline-block text-soft-sage underline underline-offset-2">Track an order</Link>
 </div>
 );
 }

 const isPaid = data.paymentStatus === "SUCCESSFUL";
 const statusLabel = ORDER_STATUS_STEPS.find((s) => s.status === data.orderStatus)?.label ?? data.orderStatus;

 return (
 <div className="container-zed max-w-2xl py-14 lg:py-20">
 <div className="text-center">
 {isPaid ? (
 <span className="glass-strong mx-auto grid size-16 place-items-center rounded-full text-[#07111F]">
 <CheckCircle2 className="size-9 text-soft-sage" />
 </span>
 ) : (
 <span className="glass-strong mx-auto grid size-16 place-items-center rounded-full text-amber-500">
 <Package className="size-9" />
 </span>
 )}
 <h1 className="mt-4 font-display text-3xl font-bold text-[#07111F]">
 {isPaid ? "Thank you - it&apos;s on its way!" : "Order placed"}
 </h1>
 <p className="mt-2 text-sm text-[#334155]">
 {isPaid
 ? <>We got your payment. Order <strong className="text-deep-olive">{data.orderNumber}</strong> is confirmed.</>
 : <>We&apos;ve saved order <strong className="text-deep-olive">{data.orderNumber}</strong>. Complete your M-PESA payment to confirm it.</>}
 </p>
 </div>

 <div className="glass-card mt-8 rounded-zed p-6">
 <dl className="grid gap-3 text-sm sm:grid-cols-2">
 <div>
 <dt className="text-[#334155]">Order number</dt>
 <dd className="font-semibold text-[#07111F]">{data.orderNumber}</dd>
 </div>
 <div>
 <dt className="text-[#334155]">Total paid</dt>
 <dd className="font-semibold text-[#07111F]">{formatKES(data.total)}</dd>
 </div>
 <div>
 <dt className="text-[#334155]">Payment</dt>
 <dd className="font-semibold text-emerald-700">{isPaid ? `Paid via ${data.payments[0]?.provider === "FLUTTERWAVE" ? "card" : "M-PESA"}` : "Awaiting payment"}{data.payments[0]?.mpesaReceipt ? ` (${data.payments[0].mpesaReceipt})` : ""}</dd>
 </div>
 <div>
 <dt className="text-[#334155]">Status</dt>
 <dd className="font-semibold text-[#07111F]">{statusLabel}</dd>
 </div>
 </dl>

 <div className="glass-panel mt-5 rounded-zed p-4 text-sm text-[#07111F]">
 {isPaid ? (
 <>We&apos;re preparing your gift now. You&apos;ll get email updates as it ships - same-day in Nairobi if ordered before 2 PM.</>
 ) : (
 <>Keep the M-PESA prompt on your phone to approve payment. You can head to track order any time - status updates live.</>
 )}
 </div>
 </div>

 <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
 <Link href={`/track?order=${data.orderNumber}`} className="rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white">
 Track order
 </Link>
 <Link href="/shop" className="rounded-zed glass-panel px-5 py-3 text-sm font-semibold text-[#07111F] hover:text-deep-olive">
 Continue shopping
 </Link>
 </div>

 <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-[#334155]">
 <QrCode className="size-4" /> Keep your order number handy for quick order lookup.
 </p>
 </div>
 );
}