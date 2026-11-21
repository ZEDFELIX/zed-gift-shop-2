import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/data/settings";
import { SITE } from "@/lib/constants";
import { WrapAGiftClient } from "@/components/gift-wrap/WrapAGiftClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wrap a Gift | Zed Gift Shop",
  description: "Choose beautiful gift packaging and add a personal message to make your gift extra special.",
};

export default async function WrapAGiftPage() {
  const [wraps, whatsappSetting] = await Promise.all([prisma.giftWrap.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, price: true, image: true, description: true },
  }).catch(() => []), getSetting("whatsappNumber").catch(() => null)]);
  const whatsappDigits = typeof whatsappSetting === "string" ? whatsappSetting.replace(/[^0-9]/g, "") : "";
  const whatsappNumber = /^[0-9]{10,15}$/.test(whatsappDigits) ? whatsappDigits : SITE.whatsappNumber;

  return <WrapAGiftClient wraps={wraps} whatsappNumber={whatsappNumber} />;
}
