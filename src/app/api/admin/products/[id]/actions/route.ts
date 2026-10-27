import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("products.manage");
  } catch {
    return NextResponse.json({ error: "You do not have permission to manage products." }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = (body as { action?: unknown } | null)?.action;
  if (action !== "archive" && action !== "activate") {
    return NextResponse.json({ error: "Unsupported product action." }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, status: true, publishedAt: true } });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const product = await prisma.product.update({
    where: { id },
    data: action === "archive"
      ? { status: "ARCHIVED" }
      : { status: "ACTIVE", publishedAt: existing.publishedAt ?? new Date() },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json({ product });
}
