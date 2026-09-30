import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const user = await getCurrentUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 const existing = await prisma.occasionReminder.findFirst({ where: { id, userId: user.id } });
 if (!existing) return NextResponse.json({ error: "Reminder not found." }, { status: 404 });

 await prisma.occasionReminder.delete({ where: { id } });
 return NextResponse.json({ ok: true });
}