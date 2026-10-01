import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCustomerAdmin } from "@/lib/data/admin";
import { formatKES, formatDate, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { CustomerStatusControl } from "@/components/admin/CustomerStatusControl";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customer | Admin" };

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const customer = await getCustomerAdmin(id);
  if (!customer) notFound();

  const addresses = customer.addresses ?? [];
  const orders = customer.orders ?? [];
  const reviews = customer.reviews ?? [];
  const wishlistItems = customer.wishlist?.items ?? [];

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-sm font-semibold text-soft-sage hover:underline">
        &larr; All customers
      </Link>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-zed border border-edge bg-white p-6">
          <h1 className="font-display text-2xl font-bold text-[#07111F]">{customer.name}</h1>
          <p className="text-sm text-[#334155]">{customer.email}</p>
          {customer.phone && <p className="text-sm text-[#334155]">{customer.phone}</p>}

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat label="Orders" value={String(customer._count.orders)} />
            <Stat label="Total spent" value={formatKES(customer.totalSpent)} />
            <Stat label="Joined" value={formatDate(customer.createdAt)} />
          </dl>
        </div>

        <div className="rounded-zed border border-edge bg-white p-6">
          <h2 className="font-display text-base font-bold text-[#07111F]">Account status</h2>
          <p className="mt-1 text-xs text-[#334155]">
            Last sign-in: {customer.lastLoginAt ? formatDateTime(customer.lastLoginAt) : "never"}
          </p>
          <div className="mt-3">
            <CustomerStatusControl customerId={customer.id} initialStatus={customer.status} />
          </div>
        </div>
      </section>

      <section className="rounded-zed border border-edge bg-white">
        <h2 className="border-b border-edge p-4 font-display text-base font-bold text-[#07111F]">Recent orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge bg-panel text-left text-xs uppercase tracking-wider text-[#334155]">
                <th className="p-3">Order</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-panel/50">
                  <td className="p-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-soft-sage hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3 font-semibold text-[#07111F]">{formatKES(o.total)}</td>
                  <td className="p-3 text-[#334155]">{PAYMENT_STATUS_LABELS[o.paymentStatus] ?? o.paymentStatus}</td>
                  <td className="p-3 text-[#334155]">{ORDER_STATUS_LABELS[o.orderStatus] ?? o.orderStatus}</td>
                  <td className="p-3 text-xs text-[#334155]">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#334155]">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-zed border border-edge bg-white p-6">
          <h2 className="font-display text-base font-bold text-[#07111F]">Addresses</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {addresses.map((a) => (
              <li key={a.id} className="rounded-zed border border-edge p-3">
                <p className="font-semibold text-[#07111F]">{a.label ?? "Address"}</p>
                <p className="text-[#334155]">
                  {[a.line1, a.line2, a.town, a.county].filter(Boolean).join(", ")}
                </p>
              </li>
            ))}
            {addresses.length === 0 && <li className="text-[#334155]">No saved addresses.</li>}
          </ul>
        </div>

        <div className="rounded-zed border border-edge bg-white p-6">
          <h2 className="font-display text-base font-bold text-[#07111F]">Wishlist</h2>
          <ul className="mt-3 divide-y divide-edge text-sm">
            {wishlistItems.map((w) => (
              <li key={w.id} className="py-2">
                <Link href={`/product/${w.product.slug}`} className="text-[#07111F] hover:text-soft-sage">
                  {w.product.name}
                </Link>
              </li>
            ))}
            {wishlistItems.length === 0 && <li className="py-2 text-[#334155]">Nothing saved.</li>}
          </ul>
        </div>
      </section>

      <section className="rounded-zed border border-edge bg-white p-6">
        <h2 className="font-display text-base font-bold text-[#07111F]">Reviews ({reviews.length})</h2>
        <ul className="mt-3 divide-y divide-edge text-sm">
          {reviews.map((r) => (
            <li key={r.id} className="py-2">
              <span className="font-semibold text-amber-600">{r.rating}★</span>{" "}
              <span className="text-[#07111F]">{r.title ?? "Untitled"}</span>{" "}
              <span className="text-xs text-[#334155]">({r.status})</span>
            </li>
          ))}
          {reviews.length === 0 && <li className="py-2 text-[#334155]">No reviews.</li>}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[#334155]">{label}</dt>
      <dd className="font-display text-lg font-bold text-[#07111F]">{value}</dd>
    </div>
  );
}
