"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, FileEdit, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { parseBlogBody, slugify, formatBlogDate, type BlogBlock } from "@/lib/blog-format";

export type BlogAdminRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  authorName: string | null;
  coverImage: string | null;
  coverAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
};

type EditorState = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  authorName: string;
  coverImage: string;
  coverAlt: string;
  seoTitle: string;
  seoDescription: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
};

const EMPTY: EditorState = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  category: "",
  authorName: "ZED Gift Shop",
  coverImage: "",
  coverAlt: "",
  seoTitle: "",
  seoDescription: "",
  status: "DRAFT",
  publishedAt: null,
};

function previewBlocks(body: string): BlogBlock[] {
  return parseBlogBody(body);
}

export function BlogManager({ initial }: { initial: BlogAdminRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const slugTouched = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const categories = useMemo(() => [...new Set(initial.map((r) => r.category))], [initial]);
  const published = rows.filter((r) => r.status === "PUBLISHED").length;

  function openEditor(row: BlogAdminRow | null) {
    setMessage(null);
    setPreviewOpen(false);
    slugTouched.current = false;
    if (!row) {
      setEditor({ ...EMPTY });
      return;
    }
    setEditor({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      body: row.body,
      category: row.category,
      authorName: row.authorName ?? "",
      coverImage: row.coverImage ?? "",
      coverAlt: row.coverAlt ?? "",
      seoTitle: row.seoTitle ?? "",
      seoDescription: row.seoDescription ?? "",
      status: row.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      publishedAt: row.publishedAt,
    });
  }

  function patch(d: Partial<EditorState>) {
    setEditor((e) => (e ? { ...e, ...d } : e));
  }

  async function uploadCover(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        patch({ coverImage: data.url });
      } else {
        setMessage({ kind: "err", text: data.error ?? "Upload failed. Paste an image URL instead." });
      }
    } catch {
      setMessage({ kind: "err", text: "Upload failed. Paste an image URL instead." });
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!editor) return;
    if (!editor.title.trim() || !editor.body.trim()) {
      setMessage({ kind: "err", text: "A title and article body are required." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        title: editor.title,
        slug: editor.slug.trim() || slugify(editor.title),
        excerpt: editor.excerpt,
        body: editor.body,
        category: editor.category || "Gifting tips",
        authorName: editor.authorName,
        coverImage: editor.coverImage,
        coverAlt: editor.coverAlt,
        seoTitle: editor.seoTitle,
        seoDescription: editor.seoDescription,
        status: editor.status,
      };
      const res = editor.id
        ? await fetch(`/api/admin/blog/${editor.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await res.json()) as { ok?: boolean; post?: { slug: string; status: string }; error?: string };
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Saving failed." });
        return;
      }
      setMessage({ kind: "ok", text: editor.status === "PUBLISHED" ? "Article saved and published." : "Draft saved. Only you and staff can see it." });
      router.refresh();
      await new Promise((r) => setTimeout(r, 350));
      window.location.reload();
    } catch {
      setMessage({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: BlogAdminRow) {
    if (!window.confirm(`Delete "${row.title}"? This permanently removes the article and its URL.`)) return;
    setDeletingId(row.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/blog/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setMessage({ kind: "err", text: data.error ?? "Deleting failed." });
        return;
      }
      setRows((current) => current.filter((r) => r.id !== row.id));
      if (editor?.id === row.id) setEditor(null);
      setMessage({ kind: "ok", text: "Article deleted." });
      router.refresh();
    } catch {
      setMessage({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setDeletingId(null);
    }
  }

  async function quickToggle(row: BlogAdminRow) {
    setTogglingId(row.id);
    setMessage(null);
    try {
      const nextStatus = row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      const res = await fetch(`/api/admin/blog/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt,
          body: row.body,
          category: row.category,
          authorName: row.authorName ?? "",
          coverImage: row.coverImage ?? "",
          coverAlt: row.coverAlt ?? "",
          seoTitle: row.seoTitle ?? "",
          seoDescription: row.seoDescription ?? "",
          status: nextStatus,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setMessage({ kind: "err", text: data.error ?? "Update failed." });
        return;
      }
      setRows((current) =>
        current.map((r) => (r.id === row.id ? { ...r, status: nextStatus } : r)),
      );
      setMessage({ kind: "ok", text: nextStatus === "PUBLISHED" ? `"${row.title}" is now live on /blog/${row.slug}.` : `"${row.title}" is now a private draft.` });
      router.refresh();
    } catch {
      setMessage({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setTogglingId(null);
    }
  }

  const blocks = editor ? previewBlocks(editor.body) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#334155]">
          <span className="font-bold text-[#07111F]">{published}</span> published &middot;{" "}
          <span className="font-bold text-[#07111F]">{initial.length - published}</span> drafts &middot; {initial.length} total
        </p>
        <button onClick={() => openEditor(null)} className="flex items-center gap-2 rounded-zed bg-deep-olive px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zed-900">
          <Plus className="size-4" /> New article
        </button>
      </div>

      {message && (
        <p className={`rounded-zed px-4 py-3 text-sm ${message.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`} role="status">
          {message.text}
        </p>
      )}

      {/* Editor */}
      {editor && (
        <div className="rounded-zed border border-edge bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-3">
            <h3 className="font-display text-lg font-bold text-[#07111F]">
              {editor.id ? <>Edit article {editor.publishedAt ? <span className="text-xs font-semibold text-charcoal/45">- published {formatBlogDate(editor.publishedAt)}</span> : <span className="text-xs font-semibold text-amber-600">- draft</span>}</> : "New article"}
            </h3>
            {editor.status === "PUBLISHED" && editor.slug ? (
              <Link href={`/blog/${editor.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-soft-sage hover:underline">
                View live &nearr;
              </Link>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="label">Title *</span>
              <input
                value={editor.title}
                onChange={(e) => patch(slugTouched.current ? { title: e.target.value } : { title: e.target.value, slug: slugify(e.target.value) })}
                className="field"
                maxLength={160}
              />
            </label>
            <label className="block">
              <span className="label">URL slug</span>
              <input
                value={editor.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  patch({ slug: e.target.value.toLowerCase() });
                }}
                placeholder={slugify(editor.title) || "auto-generated"}
                className="field"
              />
            </label>
            <label className="block">
              <span className="label">Category *</span>
              <input
                value={editor.category}
                onChange={(e) => patch({ category: e.target.value })}
                list="blog-cats"
                placeholder="e.g. Gifting tips, Guides, Corporate"
                className="field"
              />
              <datalist id="blog-cats">
                {[...new Set([...categories, "Gifting tips", "Guides", "Corporate", "Personalized", "Delivery"])].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="label">Author (optional)</span>
              <input value={editor.authorName} onChange={(e) => patch({ authorName: e.target.value })} className="field" maxLength={80} />
            </label>
            <label className="block">
              <span className="label">Excerpt *</span>
              <textarea value={editor.excerpt} onChange={(e) => patch({ excerpt: e.target.value })} className="field min-h-20 py-2" maxLength={400} placeholder="Short summary shown on cards and searches." />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Article body *</span>
            </label>
            <div className="sm:col-span-2">
              <textarea
                value={editor.body}
                onChange={(e) => patch({ body: e.target.value })}
                className="field min-h-72 py-3 font-mono text-[13px] leading-relaxed"
                placeholder={"Opening paragraph...\n\n## A section heading\n\nMore paragraphs. Bullet lists start lines with \"- \".\n- Point one\n- Point two\n\nAdd links like [Shop gifts](https://zed-gift-shop-2.vercel.app/shop) inside paragraphs."}
              />
              <p className="mt-1 text-[11px] text-charcoal/45">
                Formatting: one line per paragraph. Blank line = new paragraph. &quot;## &quot; = heading, &quot;- &quot; = bullet, [text](https://...) = link. No raw HTML.
              </p>
            </div>

            <label className="block sm:col-span-2">
              <span className="label">Cover image</span>
              <div className="flex gap-2">
                <input value={editor.coverImage} onChange={(e) => patch({ coverImage: e.target.value })} className="field" placeholder="Paste an image URL, or upload from device" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex shrink-0 items-center gap-1.5 rounded-md border border-edge bg-white px-3 text-xs font-bold text-[#334155] hover:border-charcoal/20 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                  Upload
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadCover(file);
                    e.target.value = "";
                  }}
                />
              </div>
              {editor.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editor.coverImage} alt="Cover preview" className="mt-2 aspect-[16/9] w-full max-w-md rounded-lg border border-edge object-cover" />
              ) : null}
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Cover image alt text (SEO + accessibility)</span>
              <input value={editor.coverAlt} onChange={(e) => patch({ coverAlt: e.target.value })} className="field" maxLength={220} />
            </label>
            <label className="block">
              <span className="label">Status</span>
              <select value={editor.status} onChange={(e) => patch({ status: e.target.value as EditorState["status"] })} className="field">
                <option value="DRAFT">Draft (private)</option>
                <option value="PUBLISHED">Published (live)</option>
              </select>
            </label>
            <label className="block">
              <span className="label">SEO title (optional, falls back to title)</span>
              <input value={editor.seoTitle} onChange={(e) => patch({ seoTitle: e.target.value })} className="field" maxLength={160} />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">SEO description (optional, falls back to excerpt)</span>
              <input value={editor.seoDescription} onChange={(e) => patch({ seoDescription: e.target.value })} className="field" maxLength={300} />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={save} disabled={busy} className="flex items-center gap-2 rounded-zed bg-deep-olive px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
            </button>
            <button
              onClick={() => setPreviewOpen((p) => !p)}
              className="flex items-center gap-2 rounded-zed glass-panel px-5 py-2.5 text-sm font-bold text-[#07111F]"
            >
              {previewOpen ? <><EyeOff className="size-4" /> Hide preview</> : <><Eye className="size-4" /> Preview</>}
            </button>
            <button onClick={() => { setEditor(null); setPreviewOpen(false); }} className="text-sm font-semibold text-charcoal/55 hover:text-[#07111F]">
              Cancel
            </button>
          </div>

          {previewOpen && (
            <div className="mt-4 rounded-zed border border-edge bg-panel/40 p-4">
              <p className="eyebrow">{editor.category || "Category"}</p>
              <h4 className="mt-1 font-display text-2xl font-bold text-[#07111F]">{editor.title || "Untitled article"}</h4>
              <p className="mt-1 text-xs text-charcoal/50">{formatBlogDate(new Date())} &middot; preview</p>
              {editor.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editor.coverImage} alt={editor.coverAlt || "Cover preview"} className="mt-3 aspect-[16/9] w-full rounded-lg border border-edge object-cover" />
              )}
              {editor.excerpt && <p className="mt-3 leading-relaxed text-[#334155]">{editor.excerpt}</p>}
              <div className="mt-4 space-y-4">
                {blocks.map((b, i) =>
                  b.type === "h2" ? (
                    <h5 key={i} className="font-display text-lg font-bold text-[#07111F]">{b.text}</h5>
                  ) : b.type === "ul" ? (
                    <ul key={i} className="list-inside list-disc space-y-1 text-sm text-[#07111F]">
                      {b.items.map((tokens, j) => (
                        <li key={j}>{tokens.map((t, k) => (t.kind === "link" ? (
                          <a key={k} href={t.url} className="text-[var(--color-rose-500)] underline">{t.text}</a>
                        ) : (<span key={k}>{t.text}</span>)))}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i} className="leading-relaxed text-[#07111F]">
                      {b.tokens.map((t, k) => (t.kind === "link" ? (
                        <a key={k} href={t.url} className="text-[var(--color-rose-500)] underline">{t.text}</a>
                      ) : (<span key={k}>{t.text}</span>)))}
                    </p>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {initial.map((row) => (
          <div key={row.id} className="rounded-zed border border-edge bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-bold text-[#07111F]">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${row.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {row.status === "PUBLISHED" ? "Live" : "Draft"}
                  </span>
                  {row.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-charcoal/55">/blog/{row.slug} &middot; {row.category}{row.publishedAt ? ` &middot; published ${formatBlogDate(row.publishedAt)}` : ""}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {togglingId === row.id ? (
                  <Loader2 className="size-4 animate-spin text-charcoal/40" />
                ) : (
                  <button onClick={() => quickToggle(row)} className="rounded-md border border-edge px-2.5 py-1.5 text-xs font-bold text-[#334155] hover:border-charcoal/20">
                    {row.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </button>
                )}
                <button onClick={() => openEditor(row)} className="grid size-8 place-items-center rounded-md border border-edge text-charcoal/60 hover:border-charcoal/20 hover:text-[#07111F]" aria-label={`Edit ${row.title}`}>
                  <FileEdit className="size-4" />
                </button>
                {deletingId === row.id ? (
                  <Loader2 className="size-4 animate-spin text-charcoal/40" />
                ) : (
                  <button onClick={() => remove(row)} className="grid size-8 place-items-center rounded-md border border-edge text-red-500 hover:border-red-300 hover:bg-red-50" aria-label={`Delete ${row.title}`}>
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
