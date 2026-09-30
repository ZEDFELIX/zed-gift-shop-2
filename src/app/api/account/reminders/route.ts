import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reminderSchema } from "@/lib/validations";

export const runtime = "nodejs";

const OCCASION_ENUMS = [
 "BIRTHDAY", "ANNIVERSARY", "WEDDING", "GRADUATION", "VALENTINES",
 "MOTHERS_DAY", "FATHERS_DAY", "CHRISTMAS", "OTHER",
] as const;

export async function GET() {
 const session = await getSession();
 if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const reminders = await prisma.occasionReminder.findMany({
 where: { userId: session.sub },
 orderBy: { date: "asc" },
 });
 return NextResponse.json({ reminders });
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

 const parsed = reminderSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the reminder." }, { status: 400 });
 }

 const occasion = OCCASION_ENUMS.includes(parsed.data.occasion.toUpperCase() as (typeof OCCASION_ENUMS)[number])
 ? (parsed.data.occasion.toUpperCase() as (typeof OCCASION_ENUMS)[number])
 : "OTHER";

 const date = new Date(parsed.data.date);
 if (Number.isNaN(date.getTime())) {
 return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
 }

 const reminder = await prisma.occasionReminder.create({
 data: {
 userId: session.sub,
 personName: parsed.data.personName,
 occasion,
 date,
 relationship: parsed.data.relationship || null,
 notes: parsed.data.notes || null,
 repeatsAnnually: parsed.data.repeatsAnnually ?? true,
 },
 });

 return NextResponse.json({ reminder }, { status: 201 });
}