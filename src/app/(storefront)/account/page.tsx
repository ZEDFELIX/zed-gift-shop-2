import Link from "next/link";
import {
  ArrowUpRight, Bell, Heart, MapPin, Package, Search, Settings2, UserRound
} from "lucide-react";

export const metadata = { title: "My account" };

const shoppingLinks = [
  { label: "Browse gifts", detail: "Explore gifts for every occasion", icon: Search, href: "/shop" },
  { label: "My orders", detail: "View orders and track purchases", icon: Package, href: "/account/orders" },
  { label: "Saved gifts", detail: "Your wishlist and favourite items", icon: Heart, href: "/account/wishlist" },
];

const accountLinks = [
  { label: "My addresses", detail: "Manage your delivery addresses", icon: MapPin, href: "/account/addresses" },
  { label: "Date reminders", detail: "Keep birthdays and special dates close", icon: Bell, href: "/account/reminders" },
  { label: "Profile settings", detail: "Update your personal and login details", icon: UserRound, href: "/account/settings" },
];

function AccountLink({ item }: { item: (typeof shoppingLinks)[number] | (typeof accountLinks)[number] }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group flex min-h-[88px] min-w-0 items-center gap-3 rounded-xl border border-[#e8e8e8] bg-white p-3.5 transition hover:border-[#c9c9c9] hover:bg-[#fafafa] sm:min-h-[98px] sm:rounded-2xl sm:p-4"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f4f4f4] text-[#292929] sm:size-11">
        <Icon className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-[#202020] sm:text-sm">{item.label}</span>
        <span className="mt-1 block text-[10px] leading-relaxed text-[#858585] sm:text-[11px]">{item.detail}</span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-[#aaa] transition group-hover:text-[#202020]" />
    </Link>
  );
}

export default function AccountOverviewPage() {
  return (
    <div className="space-y-7 sm:space-y-9">
      <section className="border-b border-[#ededed] pb-5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#999]">Your account</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-[#171717] sm:text-2xl">Account overview</h2>
          <span className="text-[10px] text-[#888] sm:text-xs">Everything in one place</span>
        </div>
        <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#777] sm:text-sm">
          Manage your orders, saved gifts, delivery details and personal settings from here.
        </p>
      </section>

      <section aria-labelledby="shopping-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 id="shopping-heading" className="text-sm font-semibold text-[#222] sm:text-base">Shopping</h3>
            <p className="mt-0.5 text-[10px] text-[#999] sm:text-xs">Your purchases and favourite gifts</p>
          </div>
          <span className="text-[10px] text-[#999]">3 sections</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 min-[520px]:grid-cols-2 xl:grid-cols-3">
          {shoppingLinks.map((item) => <AccountLink key={item.href} item={item} />)}
        </div>
      </section>

      <section aria-labelledby="details-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 id="details-heading" className="text-sm font-semibold text-[#222] sm:text-base">Personal details</h3>
            <p className="mt-0.5 text-[10px] text-[#999] sm:text-xs">Keep your account information up to date</p>
          </div>
          <span className="text-[10px] text-[#999]">3 sections</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 min-[520px]:grid-cols-2 xl:grid-cols-3">
          {accountLinks.map((item) => <AccountLink key={item.href} item={item} />)}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-[#e9e9e9] bg-[#f8f8f8] p-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:px-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#333]"><Settings2 className="size-4" /></span>
          <div>
            <p className="text-xs font-semibold text-[#222] sm:text-sm">Need to update your account?</p>
            <p className="mt-1 text-[10px] text-[#888] sm:text-xs">Your profile and account preferences are available in settings.</p>
          </div>
        </div>
        <Link href="/account/settings" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#202020] px-4 text-[10px] font-semibold text-white transition hover:bg-[#383838] sm:text-xs">
          Open settings <ArrowUpRight className="size-3.5" />
        </Link>
      </section>
    </div>
  );
}
