import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
 try { await requirePermission("settings.manage"); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const [title, subtitle, startsAt, endsAt, active, boxColor] = await Promise.all([
   prisma.adminSetting.findUnique({ where: { key: "flashSaleTitle" } }),
   prisma.adminSetting.findUnique({ where: { key: "flashSaleSubtitle" } }),
   prisma.adminSetting.findUnique({ where: { key: "flashSaleStartsAt" } }),
   prisma.adminSetting.findUnique({ where: { key: "flashSaleEndsAt" } }),
   prisma.adminSetting.findUnique({ where: { key: "flashSaleActive" } }),
   prisma.adminSetting.findUnique({ where: { key: "flashSaleBoxColor" } }),
  ]);
  return NextResponse.json({
   title: title ? JSON.parse(title.value) : "Customer Service Week Sale",
   subtitle: subtitle ? JSON.parse(subtitle.value) : "Limited-time offers on selected gifts.",
   startsAt: startsAt ? JSON.parse(startsAt.value) : "",
   endsAt: endsAt ? JSON.parse(endsAt.value) : "",
   active: active ? Boolean(JSON.parse(active.value)) : false,
   boxColor: boxColor && /^#[0-9a-fA-F]{6}$/.test(String(JSON.parse(boxColor.value))) ? String(JSON.parse(boxColor.value)) : "#FBE9EE",
   productIds: await prisma.product.findMany({ where: { tags: { has: "flash-sale" } }, select: { id: true } }).then((items) => items.map((item) => item.id)),
  });
}

export async function PATCH(req: Request) {
 try { await requirePermission("settings.manage"); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
 const body = await req.json();
  const hasProductSelection = Array.isArray(body.productIds);
  const productIds = hasProductSelection ? [...new Set(body.productIds.filter((id: unknown): id is string => typeof id === "string"))] : [];
  const boxColor = typeof body.boxColor === "string" && /^#[0-9a-fA-F]{6}$/.test(body.boxColor.trim()) ? body.boxColor.trim() : "#FBE9EE";
  const values = [
   ["flashSaleTitle", String(body.title ?? "").trim()],
   ["flashSaleSubtitle", String(body.subtitle ?? "").trim()],
   ["flashSaleStartsAt", String(body.startsAt ?? "")],
   ["flashSaleEndsAt", String(body.endsAt ?? "")],
   ["flashSaleActive", Boolean(body.active)],
   ["flashSaleBoxColor", boxColor],
  ] as const;
 await prisma.$transaction(async (tx) => {
  for (const [key, value] of values) {
   await tx.adminSetting.upsert({ where: { key }, update: { value: JSON.stringify(value) }, create: { key, value: JSON.stringify(value) } });
  }
  if (hasProductSelection) {
   const selected = await tx.product.findMany({ where: { id: { in: productIds } }, select: { id: true, tags: true } });
   const selectedIds = new Set(selected.map((product) => product.id));
   const current = await tx.product.findMany({ where: { tags: { has: "flash-sale" } }, select: { id: true, tags: true } });
   for (const product of current) {
    if (selectedIds.has(product.id)) continue;
    await tx.product.update({ where: { id: product.id }, data: { tags: product.tags.filter((tag) => tag !== "flash-sale") } });
   }
   for (const product of selected) {
    if (product.tags.includes("flash-sale")) continue;
    await tx.product.update({ where: { id: product.id }, data: { tags: [...product.tags, "flash-sale"] } });
   }
  }
 });
 return NextResponse.json({ ok: true });
}
