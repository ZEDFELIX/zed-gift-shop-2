import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blogPostSchema, sanitizeBlogPost, resolveBlogSlug } from "@/lib/blog-validation";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await (async () => {
    try {
      return await requireAdmin();
    } catch {
      return null;
    }
  })();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const requestedSlug = (parsed.data.slug && parsed.data.slug.trim()) || "";
  if (requestedSlug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(requestedSlug)) {
    return NextResponse.json({ error: "Slug must be lowercase words separated by hyphens (a-z, 0-9, dashes)." }, { status: 400 });
  }

  try {
    const slug = await resolveBlogSlug(requestedSlug || parsed.data.title);
    const post = await prisma.blogPost.create({
      data: {
        ...sanitizeBlogPost(parsed.data),
        slug,
        status: parsed.data.status,
        publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
      },
      select: { id: true, slug: true, status: true },
    });
    await writeAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "blog.post_created",
      entity: "BlogPost",
      entityId: post.id,
      after: { slug: post.slug, status: post.status },
    });
    return NextResponse.json({ ok: true, post });
  } catch (e) {
    console.error("blog post create failed", e);
    return NextResponse.json({ error: "Saving the article failed. Please try again." }, { status: 500 });
  }
}
