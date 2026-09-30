import { Gift, MapPin, Package, Heart, Users, Truck } from "lucide-react";

export const metadata = { title: "About Us | ZED Gift Shop", description: "ZED Gift Shop is a Nairobi-based gifting studio making personalized, thoughtfully chosen gifts delivered across Kenya." };

const values = [
 { icon: Heart, title: "Personal, always", body: "Engraving, names, messages and custom packaging - every gift is turned into something that feels made for that one person." },
 { icon: Package, title: "Quality you can feel", body: "We source premium materials and check every item before it ships, so what arrives is exactly what the moment deserves." },
 { icon: Truck, title: "On time, every time", body: "Same-day delivery across Nairobi and fast, tracked delivery countrywide - even for last-minute occasions." },
 { icon: Users, title: "Bought in Kenya", body: "We support local makers and keep the whole experience shop locally, deliver locally." },
];

export default function AboutPage() {
 return (
 <div>
 <div className="bg-zed-950 py-16 text-white">
 <div className="container-zed">
 <p className="eyebrow text-white">Our story</p>
 <h1 className="mt-2 max-w-2xl font-display text-4xl font-black sm:text-5xl">Gifts that say more.</h1>
 <p className="mt-5 max-w-2xl text-white/75">
 ZED Gift Shop started with a simple frustration: the best gifts in Kenya were hard to find, and the
 personal ones took weeks. We wanted fast, beautiful, heartfelt gifting - so we built it.
 </p>
 </div>
 </div>

 <div className="container-zed py-14">
 <div className="max-w-3xl space-y-6 text-[#171717] leading-relaxed">
 <p>
 Every order at ZED is picked by hand, wrapped with care, and personalized to your message. From engraved
 keepsakes and mugs to custom hampers and corporate gift boxes, we obsess over the details that turn a
 present into a memory.
 </p>
 <p>
 We&apos;re based in Nairobi and we know Kenyan occasions - birthdays, weddings, Ruracio, baby showers,
 graduations, Eid, Christmas and the countless moments in between. When the date matters, we deliver.
 </p>
 <p>
 Big or small, one gift or a hundred, we&apos;d love to help you make someone&apos;s day.
 </p>
 </div>

 <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
 {values.map((v) => (
 <div key={v.title} className="glass-card rounded-zed p-6">
 <span className="grid size-11 place-items-center rounded-zed glass-panel text-deep-olive">
 <v.icon className="size-5" />
 </span>
 <p className="mt-4 font-display font-bold text-[#171717]">{v.title}</p>
 <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">{v.body}</p>
 </div>
 ))}
 </div>

 <div className="mt-12 flex flex-col items-center gap-3 rounded-zed bg-zed-950 p-8 text-center text-white sm:flex-row sm:justify-between sm:text-left">
 <div className="flex items-center gap-3">
 <MapPin className="size-6 text-white" />
 <p className="text-sm">Visit-by-appointment showroom in Nairobi - WhatsApp us to book.</p>
 </div>
 <div className="flex items-center gap-3">
 <Gift className="size-6 text-white" />
 <p className="text-sm">Need a custom gift? We love a challenge.</p>
 </div>
 </div>
 </div>
 </div>
 );
}