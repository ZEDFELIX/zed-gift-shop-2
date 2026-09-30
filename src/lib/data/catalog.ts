import { prisma } from "@/lib/prisma";

export async function getCategoryBySlug(slug: string) {
 return prisma.category.findUnique({ where: { slug, active: true } });
}

export async function getCollectionBySlug(slug: string) {
 return prisma.collection.findUnique({ where: { slug } });
}

export async function listCategories(kind?: "CATEGORY" | "OCCASION" | "RECIPIENT") {
 return prisma.category.findMany({
 where: { active: true, ...(kind ? { kind } : {}) },
 include: { _count: { select: { products: true } } },
 orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
 });
}

export async function listCollections() {
 return prisma.collection.findMany({
 include: { _count: { select: { products: true } } },
 orderBy: { name: "asc" },
 });
}

export async function listGiftPages() {
 return prisma.category.findMany({
 where: { active: true, kind: { in: ["OCCASION", "RECIPIENT"] } },
 include: { _count: { select: { products: true } } },
 orderBy: { sortOrder: "asc" },
 });
}

export const GIFT_PAGE_CONTENT: Record<
 string,
 { title: string; description: string }
> = {
 "for-him": {
 title: "Gifts for Him",
 description:
 "Crafted, practical and personal - find a gift that fits the man who makes every day easier. Wallets, accessories, office pieces and keepsakes he'll actually reach for.",
 },
 "for-her": {
 title: "Gifts for Her",
 description:
 "Thoughtful, elegant and personal - pieces that match her style and the way she cares for everyone else. Ready to be made truly hers with a name, a message or a photo.",
 },
 "for-couples": {
 title: "Gifts for Couples",
 description:
 "For the two of you - matching sets, shared keepsakes and experiences in a box. Personalize them with both names and the date that matters.",
 },
 birthday: {
 title: "Birthday Gifts",
 description:
 "Make the day about them. Personalized keepsakes, gift boxes and bundles that turn another year around the sun into something worth remembering.",
 },
 anniversary: {
 title: "Anniversary Gifts",
 description:
 "Celebrate the years you've built together. Engraved, personalized and made-to-last reminders of your milestone - from the first to the fifty-first.",
 },
 graduation: {
 title: "Graduation Gifts",
 description:
 "They did the work - now mark it. Personalized notebooks, desk pieces and keepsakes for the graduate stepping into what's next.",
 },
 corporate: {
 title: "Corporate Gifts",
 description:
 "Client appreciation, staff recognition and event gifting, done properly. Branded merchandise, gift boxes and bulk ordering with dedicated support.",
 },
 "for-friends": {
 title: "Gifts for Friends",
 description:
 "For the friends who feel like family. Fun, personal and no-pressure gifts that say you were paying attention.",
 },
 "for-parents": {
 title: "Gifts for Parents",
 description:
 "Show them the thought they've always given you. Classic, quality and personalized gifts for mum and dad.",
 },
 "for-colleagues": {
 title: "Gifts for Colleagues",
 description:
 "Professional, tasteful and genuinely useful - for teammates, mentors and the people you share deadlines with.",
 },
};

export async function getGiftPageContent(slug: string) {
 const category = await prisma.category.findUnique({ where: { slug, active: true } });
 const staticContent = GIFT_PAGE_CONTENT[slug];
 if (category) {
 return {
 title: category.name,
 description: category.description ?? staticContent?.description ?? "",
 fallback: staticContent?.description,
 };
 }
 return {
 title: staticContent?.title ?? "Gifts",
 description: staticContent?.description ?? "",
 fallback: null,
 };
}