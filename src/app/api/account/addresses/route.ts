import { NextResponse } from "next/server";
import { getCurrentUser, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validations";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = addressSchema.extend({
 label: z.string().max(60).optional().or(z.literal("")),
 isDefault: z.coerce.boolean().optional(),
});

export async function GET() {
 const session = await getSession();
 if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const addresses = await prisma.address.findMany({
 where: { userId: session.sub },
 orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
 });
 return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
 const session = await getSession();
 if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }

 const parsed = createSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the address." }, { status: 400 });
 }

 const user = await getCurrentUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const input = parsed.data;
 const makeDefault = input.isDefault === true;

 const address = await prisma.$transaction(async (tx) => {
 if (makeDefault) {
 await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
 }
 return tx.address.create({
 data: {
 userId: user.id,
 label: input.label || null,
 fullName: user.name,
 phone: user.phone ?? "",
 county: input.county,
 town: input.town,
 address: input.address,
 building: input.building || null,
 apartment: input.apartment || null,
 isDefault: makeDefault,
 },
 });
 });

 return NextResponse.json({ address }, { status: 201 });
}