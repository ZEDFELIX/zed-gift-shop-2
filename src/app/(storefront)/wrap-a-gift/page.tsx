import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { WrapAGiftClient } from "@/components/gift-wrap/WrapAGiftClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wrap a Gift | Zed Gift Shop",
  description: "Choose beautiful gift packaging and add a personal message to make your gift extra special.",
};

export default async function WrapAGiftPage() {
  const wraps = await prisma.giftWrap.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, price: true, image: true, description: true },
  }).catch(() => []);

  return <WrapAGiftClient wraps={wraps} />;
}
