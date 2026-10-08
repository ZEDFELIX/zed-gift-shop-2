import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
 try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
 const [title, subtitle, startsAt, endsAt, active] = await Promise.all([
  prisma.adminSetting.findUnique({ where: { key: "flashSaleTitle" } }),
  prisma.adminSetting.findUnique({ where: { key: "flashSaleSubtitle" } }),
  prisma.adminSetting.findUnique({ where: { key: "flashSaleStartsAt" } }),
  prisma.adminSetting.findUnique({ where: { key: "flashSaleEndsAt" } }),
  prisma.adminSetting.findUnique({ where: { key: "flashSaleActive" } }),
 ]);
 return NextResponse.json({
  title: title ? JSON.parse(title.value) : "Customer Service Week Sale",
  subtitle: subtitle ? JSON.parse(subtitle.value) : "Limited-time offers on selected gifts.",
  startsAt: startsAt ? JSON.parse(startsAt.value) : "",
  endsAt: endsAt ? JSON.parse(endsAt.value) : "",
  active: active ? Boolean(JSON.parse(active.value)) : false,
 });
}

export async function PATCH(req: Request) {
 try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
 const body = await req.json();
 const productIds = Array.isArray(body.productIds) ? body.productIds.filter((id: unknown): id is string => typeof id === "string") : [];
 const values = [
  ["flashSaleTitle", String(body.title ?? "").trim()],
  ["flashSaleSubtitle", String(body.subtitle ?? "").trim()],
  ["flashSaleStartsAt", String(body.startsAt ?? "")],
  ["flashSaleEndsAt", String(body.endsAt ?? "")],
  ["flashSaleActive", Boolean(body.active)],
 ] as const;
 await prisma.$transaction(async (tx) => {
  for (const [key, value] of values) {
   await tx.adminSetting.upsert({ where: { key }, update: { value: JSON.stringify(value) }, create: { key, value: JSON.stringify(value) } });
  }
  const current = await tx.product.findMany({ where: { tags: { has: "flash-sale" } }, select: { id: true, tags: true } });
  for (const p of current) {
   const tags = p.tags.filter((tag) => tag !== "flash-sale");
   if (productIds.includes(p.id)) tags.push("flash-sale");
   await tx.product.update({ where: { id: p.id }, data: { tags } });
  }
  if (productIds.length) {
   const selected = await tx.product.findMany({ where: { id: { in: productIds } }, select: { id: true, tags: true } });
   for (const p of selected) {
    if (!p.tags.includes("flash-sale")) await tx.product.update({ where: { id: p.id }, data: { tags: [...p.tags, "flash-sale"] } });
   }
  }
 });
 return NextResponse.json({ ok: true });
}
