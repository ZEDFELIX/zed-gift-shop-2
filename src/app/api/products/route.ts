import { NextResponse } from "next/server";
import { z } from "zod";
import { listProducts } from "@/lib/data/products";
import { parsePagination, pageMeta, fail } from "@/lib/api";

export const runtime = "nodejs";

/**
 * Public catalogue API. Serves the website today and the planned mobile apps
 * tomorrow, so the response is a stable paginated envelope rather than the
 * internal server-component shape.
 */
const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  occasion: z.string().trim().max(120).optional(),
  recipient: z.string().trim().max(120).optional(),
  collection: z.string().trim().max(120).optional(),
  min: z.coerce.number().int().nonnegative().optional(),
  max: z.coerce.number().int().nonnegative().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  deals: z.enum(["true", "false"]).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  personalized: z.enum(["true", "false"]).optional(),
  sort: z.enum(["featured", "newest", "price-asc", "price-desc", "rating", "best-selling"]).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail("Invalid query parameters.", 400);

  const { page, pageSize } = parsePagination(url, { pageSize: 24, max: 48 });
  const q = parsed.data;

  const result = await listProducts({
    ...q,
    deals: q.deals === "true",
    inStock: q.inStock === "true",
    personalized: q.personalized === "true",
    page,
    pageSize,
  });

  return NextResponse.json({
    data: result.items,
    meta: {
      ...pageMeta(result.page, result.pageSize, result.total),
      minPrice: result.minPrice,
      maxPrice: result.maxPrice,
    },
  });
}
