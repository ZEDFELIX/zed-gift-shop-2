import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET() {
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
    return NextResponse.json({ error: "Only an admin can add team accounts." }, { status: 403 });
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

  const requestedRole = typeof body === "object" && body !== null && "role" in body
    ? (body as { role?: unknown }).role
    : "STAFF";
  if (requestedRole !== "STAFF" && requestedRole !== "ADMIN") {
    return NextResponse.json({ error: "Choose either Staff or Admin." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const clash = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (clash) return NextResponse.json({ error: "That email already exists." }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash: await hashPassword(parsed.data.password),
      phone: parsed.data.phone || null,
      role: requestedRole,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}

export async function DELETE(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Only an admin can delete team accounts." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Team account ID required." }, { status: 400 });
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
      return NextResponse.json({ error: "You cannot delete the last active admin account." }, { status: 400 });
    }
  }
  if (target.role !== "STAFF" && target.role !== "ADMIN") {
    return NextResponse.json({ error: "Only staff or admin accounts can be deleted here. Use the customers page for customer accounts." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
