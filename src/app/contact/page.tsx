import Link from "next/link";
import { Mail, MessageCircle, Phone, Clock, MessageSquareText } from "lucide-react";
import { SITE } from "@/lib/constants";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata = { title: "Contact Us | ZED Gift Shop", description: "Questions about an order, a custom gift, or bulk corporate orders? Get in touch with ZED Gift Shop by phone, WhatsApp or email." };

export default function ContactPage() {
 return (
 <div className="container-zed py-12">
 <p className="eyebrow text-soft-sage">We&apos;re here to help</p>
 <h1 className="mt-2 max-w-2xl font-display text-4xl font-black text-[#171717] sm:text-5xl">Contact ZED Gift Shop</h1>
 <p className="mt-4 max-w-2xl text-[#171717]">
 Need help with an order, a custom or personalized gift, or a bulk corporate order? Send us a message -
 we usually reply within one working day.
 </p>

 <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
 <ContactForm />

 <aside className="space-y-4">
 <div className="rounded-zed bg-zed-950 p-6 text-white">
 <p className="eyebrow text-white">Fastest response</p>
 <div className="mt-4 space-y-3 text-sm">
 <p className="flex items-center gap-3">
 <Phone className="size-5 text-white" />
 <a className="hover:text-white" href={SITE.phoneHref}>{SITE.phone}</a>
 </p>
 <p className="flex items-center gap-3">
 <MessageCircle className="size-5 text-white" />
 <a className="hover:text-white" href={SITE.whatsappHref}>WhatsApp {SITE.phone}</a>
 </p>
 <p className="flex items-center gap-3">
 <Mail className="size-5 text-white" />
 <a className="break-all hover:text-white" href={`mailto:${SITE.email}`}>{SITE.email}</a>
 </p>
 </div>
 </div>

 <div className="glass-card rounded-zed p-6">
 <p className="flex items-center gap-2 font-display text-base font-bold text-[#171717]">
 <Clock className="size-5 text-soft-sage" /> Opening hours
 </p>
 <ul className="mt-3 space-y-1.5 text-sm text-[#171717]">
 <li className="flex justify-between"><span>Mon - Fri</span><span className="font-semibold">8:00am - 8:00pm</span></li>
 <li className="flex justify-between"><span>Saturday</span><span className="font-semibold">9:00am - 8:00pm</span></li>
 <li className="flex justify-between"><span>Sundays & holidays</span><span className="font-semibold">10:00am - 6:00pm</span></li>
 </ul>
 </div>

 <div className="glass-panel rounded-zed p-6 text-sm text-[#171717]">
 <p className="flex items-center gap-2 font-display text-base font-bold text-[#171717]">
 <MessageSquareText className="size-5 text-soft-sage" /> Business enquiries
 </p>
 <p className="mt-3">
 Corporate gifting, bulk orders and partnership enquiries: email us and a team member will follow up.
 </p>
 <Link href="/gifts/corporate" className="mt-4 inline-block rounded-zed glass-panel px-4 py-2 font-bold text-deep-olive hover:bg-zed-950">
 Corporate gifting 
 </Link>
 </div>
 </aside>
 </div>
 </div>
 );
}