import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const itemSchema = z.object({
  productId: z.string().trim().max(40).optional(),
  name: z.string().trim().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(100000),
});

const quoteSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  phone: z
    .string()
    .trim()
    .min(9, "Please enter a valid phone number.")
    .max(20)
    .regex(/^\+?[0-9][0-9\s()-]{6,}$/, "Please enter a valid phone number."),
  email: z.string().trim().email("Please enter a valid email address.").max(120).optional().or(z.literal("")),
  organisation: z.string().trim().max(120).optional().or(z.literal("")),
  budget: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ invalid_type_error: "Budget must be a number in KSh." }).int().min(0).max(100000000).optional(),
  ),
  location: z.string().trim().min(2, "Please enter a delivery location.").max(120),
  details: z.string().trim().max(600).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "Add at least one product with a quantity.").max(20, "Please split large enquiries into a few key items."),
  // Honeypot: real users never fill this in (kept out of validation on purpose).
  website: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const cast = body as { website?: string };
  if (typeof cast?.website === "string" && cast.website.trim().length > 0) {
    // Honeypot filled: silently accept without saving anything.
    return NextResponse.json({ ok: true, id: null });
  }

  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your details." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Normalize the phone (strip spaces, dashes, parentheses) so duplicates
  // match regardless of formatting and admin records stay uniform.
  const phone = d.phone.replace(/[\s()-]/g, "");
  try {
    const recent = await prisma.wholesaleQuote.count({
      where: { phone, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } },
    });
    if (recent > 0) {
      return NextResponse.json(
        { error: "We received a request from this number a few minutes ago. Our team will reach out shortly." },
        { status: 429 },
      );
    }

    const quote = await prisma.wholesaleQuote.create({
      data: {
        name: d.name,
        phone,
        email: d.email || null,
        organisation: d.organisation || null,
        location: d.location,
        budget: d.budget ?? null,
        details: d.details || null,
        itemsJson: JSON.stringify(d.items.map((i) => ({ productId: i.productId ?? null, name: i.name, quantity: i.quantity }))),
      },
    });

    return NextResponse.json({ ok: true, id: quote.id });
  } catch (e) {
    console.error("wholesale quote create failed", e);
    return NextResponse.json(
      { error: "We couldn't save your request right now. Please try again in a moment." },
      { status: 500 },
    );
  }
}
