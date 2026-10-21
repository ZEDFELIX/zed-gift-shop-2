import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blogPostSchema, sanitizeBlogPost, resolveBlogSlug } from "@/lib/blog-validation";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

type Detail = { params: Promise<{ id: string }> };

async function guard() {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

export async function PATCH(req: Request, { params }: Detail) {
  const admin = await guard();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = blogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const requestedSlug = (parsed.data.slug && parsed.data.slug.trim()) || "";
  if (requestedSlug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(requestedSlug)) {
    return NextResponse.json({ error: "Slug must be lowercase words separated by hyphens (a-z, 0-9, dashes)." }, { status: 400 });
  }

  // Keep the article's own slug; renegotiate only when it actually changes.
  let slug = requestedSlug || existing.slug;
  if (slug !== existing.slug) {
    slug = await resolveBlogSlug(slug, id);
  }

  // Preserve the original publication date once published; unpublishing clears it.
  const previouslyPublished = existing.status === "PUBLISHED" && existing.publishedAt;
  const willPublishFresh = parsed.data.status === "PUBLISHED" && !previouslyPublished;

  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...sanitizeBlogPost(parsed.data),
        slug,
        status: parsed.data.status,
        publishedAt: previouslyPublished ? existing.publishedAt : willPublishFresh ? new Date() : null,
      },
      select: { id: true, slug: true, status: true },
    });
    await writeAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "blog.post_updated",
      entity: "BlogPost",
      entityId: post.id,
      before: { slug: existing.slug, status: existing.status },
      after: { slug: post.slug, status: post.status },
    });
    return NextResponse.json({ ok: true, post });
  } catch (e) {
    console.error("blog post update failed", e);
    return NextResponse.json({ error: "Saving the article failed. Please try again." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Detail) {
  const admin = await guard();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  try {
    await prisma.blogPost.delete({ where: { id: existing.id } });
    await writeAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "blog.post_deleted",
      entity: "BlogPost",
      entityId: existing.id,
      before: { slug: existing.slug },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("blog post delete failed", e);
    return NextResponse.json({ error: "Deleting the article failed. Please try again." }, { status: 500 });
  }
}
