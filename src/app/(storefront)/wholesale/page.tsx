import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/data/settings";
import { SITE } from "@/lib/constants";
import { WholesaleWorkspace, type WholesaleProduct } from "@/components/wholesale/WholesaleWorkspace";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Wholesale Gifts for Every Business",
  path: "/wholesale",
  description: "Discover quality gifts, accessories and merchandise in bulk for retail shops, resellers, corporate gifting, events and special occasions. Request a wholesale quotation tailored to your needs.",
});

export default async function WholesalePage() {
  const [products, whatsappRaw] = await Promise.all([
    prismaProductList().catch(() => null),
    getSettingText("whatsappNumber", SITE.whatsappNumber),
  ]);

  const whatsappHref = `https://wa.me/${whatsappRaw}`;

  // Error state: catalogue unavailable
  if (products === null) {
    return (
      <div className="container-zed py-10 lg:py-14">
        <header className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Wholesale</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-[#07111F] lg:text-4xl">Wholesale Gifts for Every Business</h1>
        </header>
        <div className="mx-auto mt-8 max-w-xl rounded-zed glass-card p-6 text-center" role="alert">
          <p className="font-semibold text-[#07111F]">We could not load the catalogue right now.</p>
          <p className="mt-1 text-sm text-[#334155]">Please try refreshing, or send your enquiry directly on WhatsApp and we will respond quickly.</p>
          <a href={`${whatsappHref}?text=${encodeURIComponent("Hi ZED GIFT SHOP, I'd like a wholesale quotation.")}`} target="_blank" rel="noreferrer noopener" className="mt-4 inline-block rounded-zed bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
            WhatsApp us
          </a>
        </div>
      </div>
    );
  }

  // Category facets derived from the loaded products
  const catMap = new Map<string, { name: string; slug: string }>();
  for (const p of products) {
    if (p.categoryName && p.categorySlug && !catMap.has(p.categorySlug)) {
      catMap.set(p.categorySlug, { name: p.categoryName, slug: p.categorySlug });
    }
  }
  const categories = [...catMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const catalogue: WholesaleProduct[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    categoryName: p.categoryName || "Gifts",
    categorySlug: p.categorySlug || "",
    image: p.image,
    inStock: Boolean(p.inStock),
  }));

  return (
    <div className="container-zed py-10 lg:py-14">
      {/* Introduction */}
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Wholesale &amp; bulk</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#07111F] lg:text-4xl">Wholesale Gifts for Every Business</h1>
        <p className="mt-3 leading-relaxed text-[#07111F]">
          Discover quality gifts, accessories and merchandise in bulk for retail shops, resellers, corporate gifting, events
          and special occasions. Explore the catalogue and request a wholesale quotation tailored to your needs.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="#wholesale-catalogue" className="inline-flex items-center gap-1.5 rounded-zed bg-deep-olive px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-glass transition-colors hover:bg-zed-900">
            Browse wholesale products
          </a>
          <a href="#wholesale-quote" className="inline-flex items-center gap-1.5 rounded-zed glass-panel px-6 py-3 text-sm font-bold text-[#07111F] transition-colors hover:text-deep-olive">
            Request a wholesale quote
          </a>
        </div>
      </header>

      {/* Catalogue + quotation form */}
      <section className="mt-10">
        <WholesaleWorkspace products={catalogue} categories={categories} whatsappHref={whatsappHref} />
      </section>

      {/* Custom and corporate orders */}
      <section className="mt-12 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass-card rounded-zed p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-[#07111F]">Custom &amp; corporate orders</h2>
          <p className="mt-1 text-sm text-[#334155]">You can also enquire about:</p>
          <ul className="mt-3 grid gap-2 text-sm text-[#07111F] sm:grid-cols-2">
            {[
              "Corporate gifts",
              "Personalised gifts and packaging",
              "Event giveaways",
              "Bulk gifts for celebrations and special occasions",
              "Reseller and retail-shop orders",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-deep-olive" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-charcoal/55">
            Customisation options, minimum quantities, availability and pricing are always confirmed by the shop during quoting.
          </p>
        </div>
        <div className="glass-card flex flex-col justify-between rounded-zed p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-bold text-[#07111F]">Help with bulk orders</h2>
            <p className="mt-1 text-sm text-[#334155]">
              Questions on quantities, branding or delivery arrangements? Chat with us on WhatsApp and we will guide you.
            </p>
          </div>
          <a href={`${whatsappHref}?text=${encodeURIComponent("Hi ZED GIFT SHOP, I need help with a bulk/wholesale order.")}`} target="_blank" rel="noreferrer noopener" className="mt-4 inline-flex items-center justify-center rounded-zed bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700">
            Contact us on WhatsApp
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-bold text-[#07111F]">How wholesale ordering works</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            "Browse available products.",
            "Select products and quantities.",
            "Submit a quotation request.",
            "Receive confirmation of availability, pricing and delivery arrangements.",
            "Confirm the order and complete payment using the agreed method.",
          ].map((step, i) => (
            <li key={step} className="glass-card rounded-zed p-4">
              <span className="grid size-8 place-items-center rounded-full glass-panel font-display text-sm font-bold text-deep-olive">{i + 1}</span>
              <p className="mt-2 text-sm leading-relaxed text-[#07111F]">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-bold text-[#07111F]">Wholesale FAQ</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ["How do I place a wholesale order?", "Browse the catalogue above, note your products and quantities, then submit a quotation request. We confirm availability, pricing and delivery with you by phone or WhatsApp."],
            ["Is there a minimum order quantity?", "Minimum quantities depend on the product and whether it is personalised. They are confirmed with your quotation request - the shop will confirm exactly what applies."],
            ["How is wholesale pricing determined?", "Wholesale pricing is confirmed with the shop. Quantities, the product mix and customisation all affect it. Retail prices shown in the catalogue are per-unit retail and are not wholesale prices."],
            ["Can I request customised or branded gifts?", "Yes. Corporate gifts, personalised gifts and packaging, event giveaways and retail-shop stock can all be quoted. Options and pricing are confirmed during quoting."],
            ["Which payment methods are available?", "Payment is agreed when you confirm your order - M-Pesa and bank transfer are available for bulk orders, with receipts provided."],
            ["How are delivery arrangements confirmed?", "Delivery arrangements for every bulk order are confirmed with you by phone, agreed product by product and drop point by drop point."],
            ["Can I request a quotation without committing to a purchase?", "Yes. Quotations are free and carry no obligation - you only pay once you approve a quote."],
          ].map(([q, a]) => (
            <details key={q} className="glass-card rounded-zed p-4">
              <summary className="cursor-pointer list-none text-sm font-bold text-[#07111F]">{q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-[#334155]">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- server data helpers ---------- */

async function prismaProductList() {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 120,
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      quantity: true,
      trackInventory: true,
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } },
      categories: {
        take: 1,
        orderBy: { sortOrder: "asc" },
        select: { category: { select: { name: true, slug: true } } },
      },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    categoryName: row.categories[0]?.category.name ?? "",
    categorySlug: row.categories[0]?.category.slug ?? "",
    image: row.images[0]?.url ?? null,
    inStock: !row.trackInventory || row.quantity > 0,
  }));
}

async function getSettingText(key: string, fallback: string) {
  const raw = await getSetting(key).catch(() => null);
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback;
}
