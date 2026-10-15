import { prisma } from "@/lib/prisma";
import { PromoSlideshow } from "@/components/shop/PromoSlideshow";

const imgSel = { select: { url: true }, orderBy: { sortOrder: "asc" as const }, take: 1 };

export async function PromoSlideshowSection() {
  const [corporate, personalized] = await Promise.all([
    prisma.product.findFirst({
      where: {
        status: "ACTIVE",
        categories: {
          some: { category: { OR: [{ slug: "corporate-gifts-kenya" }, { slug: "corporate", kind: "OCCASION" }] } },
        },
        images: { some: {} },
      },
      select: { images: imgSel },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    }),
    prisma.product.findFirst({
      where: { status: "ACTIVE", personalizationEnabled: true, images: { some: {} } },
      select: { images: imgSel },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    }),
  ]);

  return (
    <PromoSlideshow
      slides={[
        {
          title: "Corporate Gifts",
          subtitle: "Branded sets, hampers and executive gifts for teams and clients.",
          cta: "Shop corporate",
          href: "/shop?category=corporate-gifts-kenya",
          image: corporate?.images[0]?.url ?? null,
        },
        {
          title: "Personalized Gifts",
          subtitle: "Names, photos and messages, printed just for them.",
          cta: "Shop personalized",
          href: "/shop?personalized=true",
          image: personalized?.images[0]?.url ?? null,
        },
      ]}
    />
  );
}
