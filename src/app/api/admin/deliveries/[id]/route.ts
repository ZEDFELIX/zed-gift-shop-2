import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deliveryZoneUpdateSchema } from "@/lib/validations";

export const runtime = "nodejs";

async function guard() {
 try {
 return await requireAdmin();
 } catch {
 return null;
 }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
 const admin = await guard();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 const existing = await prisma.deliveryZone.findUnique({ where: { id } });
 if (!existing) return NextResponse.json({ error: "Zone not found." }, { status: 404 });

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
const parsed = deliveryZoneUpdateSchema.safeParse(body);
  if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the zone." }, { status: 400 });
  }

  // The county/town pair is unique, so blank strings have to become null.
  const data = {
  ...parsed.data,
  town: parsed.data.town === "" ? null : parsed.data.town,
  deliveryTime: parsed.data.deliveryTime === "" ? null : parsed.data.deliveryTime,
  deliveryPartner: parsed.data.deliveryPartner === "" ? null : parsed.data.deliveryPartner,
  };

  const zone = await prisma.deliveryZone.update({ where: { id }, data });
  return NextResponse.json({ zone });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const admin = await guard();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 await prisma.deliveryZone.delete({ where: { id } });
 return NextResponse.json({ ok: true });
}