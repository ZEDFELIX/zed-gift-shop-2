import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/data/products";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "ACTIVE") return fail("Product not found.", 404);
  return ok(product);
}
