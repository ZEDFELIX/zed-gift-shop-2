import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deliveryZoneSchema } from "@/lib/validations";

export const runtime = "nodejs";

async function guard() {
 try {
 return await requireAdmin();
 } catch {
 return null;
 }
}

export async function GET() {
 const admin = await guard();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const zones = await prisma.deliveryZone.findMany({ orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { county: "asc" }] });
 return NextResponse.json({ zones });
}

export async function POST(req: Request) {
 const admin = await guard();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = deliveryZoneSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the zone." }, { status: 400 });
 }
 const d = parsed.data;

 const clash = await prisma.deliveryZone.findFirst({ where: { county: d.county, town: d.town ?? null } });
 if (clash) return NextResponse.json({ error: "That zone already exists for this county." }, { status: 409 });

const zone = await prisma.deliveryZone.create({
  data: {
  name: d.name,
  county: d.county,
  town: d.town ?? null,
  fee: d.fee,
  expressFee: d.expressFee ?? null,
  deliveryTime: d.deliveryTime || null,
  sameDay: d.sameDay,
  nextDay: d.nextDay,
  pickup: d.pickup,
  codAvailable: d.codAvailable,
  minOrder: d.minOrder,
  maxOrder: d.maxOrder ?? null,
  deliveryPartner: d.deliveryPartner || null,
  active: d.active,
  },
  });
 return NextResponse.json({ zone }, { status: 201 });
}