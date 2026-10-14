import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN"] } },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ staff });
}

export async function POST(req: Request) {
 const admin = await getCurrentUser();
 if (!admin || admin.role !== "ADMIN") {
 return NextResponse.json({ error: "Only the owner can add staff." }, { status: 403 });
 }

 let body: unknown;
 try {
 body = await req.json();
 } catch {
 return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
 }
 const parsed = registerSchema.safeParse(body);
 if (!parsed.success) {
 return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the details." }, { status: 400 });
 }

 const email = parsed.data.email.toLowerCase();
 const clash = await prisma.user.findUnique({ where: { email } });
 if (clash) return NextResponse.json({ error: "That email already exists." }, { status: 409 });

const user = await prisma.user.create({
  data: {
  name: parsed.data.name,
  email,
  passwordHash: await hashPassword(parsed.data.password),
  phone: parsed.data.phone || null,
  role: "STAFF",
  },
});

return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
}

export async function DELETE(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the owner can delete staff." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Staff ID required." }, { status: 400 });
  }
  if (id === admin.id) {
    return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
  }
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "You cannot delete the last admin account." }, { status: 400 });
    }
  }
  if (target.role !== "STAFF" && target.role !== "ADMIN") {
    return NextResponse.json({ error: "Only staff accounts can be deleted here. Use the customers page for customer accounts." }, { status: 400 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}