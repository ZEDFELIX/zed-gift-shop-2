import { z } from "zod";
import { listCategories } from "@/lib/data/catalog";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

const querySchema = z.object({
  kind: z.enum(["CATEGORY", "OCCASION", "RECIPIENT"]).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail("Invalid kind.", 400);
  const categories = await listCategories(parsed.data.kind);
  return ok(categories);
}
