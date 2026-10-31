import Link from "next/link";
import {
 ArrowUpRight, Bell, Heart, MapPin, Package, Search, UserRound
} from "lucide-react";

export const metadata = { title: "My account" };

const actions = [
 { label: "Browse gifts", detail: "Discover something special", icon: Search, href: "/shop" },
 { label: "My orders", detail: "Track your purchases", icon: Package, href: "/account/orders" },
 { label: "Saved gifts", detail: "View your wishlist", icon: Heart, href: "/account/wishlist" },
 { label: "My addresses", detail: "Manage delivery locations", icon: MapPin, href: "/account/addresses" },
 { label: "Date reminders", detail: "Keep special days in mind", icon: Bell, href: "/account/reminders" },
 { label: "Profile settings", detail: "Update your account details", icon: UserRound, href: "/account/settings" },
];

export default function AccountOverviewPage() {
 return (
  <div className="space-y-4 sm:space-y-5">
   <section className="border-b border-[#ededed] pb-3">
    <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#999]">Your space</p>
    <h2 className="mt-0.5 text-[clamp(17px,4vw,22px)] font-semibold leading-tight tracking-tight text-[#171717]">Quick access</h2>
    <p className="mt-1 text-[10px] text-[#888] min-[380px]:text-[11px] sm:text-xs">Choose what you would like to manage.</p>
   </section>

   <section aria-label="Quick account links" className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 min-[720px]:grid-cols-3">
    {actions.map(({ label, detail, icon: Icon, href }) => (
     <Link key={label} href={href} className="group flex min-w-0 items-center gap-3 rounded-[13px] border border-[#e7e7e7] bg-white p-3 transition hover:border-[#bdbdbd] hover:bg-[#fafafa] sm:rounded-[15px] sm:p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-[#e7e7e7] bg-[#f7f7f7] text-[#333] transition group-hover:bg-white sm:size-10"><Icon className="size-4" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-[#222] sm:text-xs">{label}</span><span className="mt-0.5 block truncate text-[9px] text-[#999] sm:text-[10px]">{detail}</span></span>
      <ArrowUpRight className="size-3.5 shrink-0 text-[#aaa] transition group-hover:text-[#222]" />
     </Link>
    ))}
   </section>
  </div>
 );
}
