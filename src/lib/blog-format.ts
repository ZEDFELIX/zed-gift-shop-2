// Shared blog formatting helpers. No server-only dependency so both server
// pages and the admin live-preview component can use them.

export type InlineToken = { kind: "text"; text: string } | { kind: "link"; text: string; url: string };

export type BlogBlock =
  | { type: "p"; tokens: InlineToken[] }
  | { type: "h2"; text: string }
  | { type: "ul"; items: InlineToken[][] };

const LINK_RE = /\[([^\]\n]{1,200})\]\(([^()\s]{1,500})\)/g;

/** Only absolute http(s), site-relative or same-page-anchor URLs survive. */
function safeUrl(url: string): string | null {
  const u = url.trim();
  if (/^https?:\/\/\S+$/i.test(u)) return u;
  if (u.startsWith("/") && !u.startsWith("//")) return u;
  if (u.startsWith("#") && u.length > 1) return u;
  return null;
}

function inlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) tokens.push({ kind: "text", text: text.slice(last, idx) });
    const url = safeUrl(m[2]);
    tokens.push(url ? { kind: "link", text: m[1], url } : { kind: "text", text: m[1] });
    last = idx + m[0].length;
  }
  if (last < text.length) tokens.push({ kind: "text", text: text.slice(last) });
  return tokens;
}

/**
 * Parses the admin-authored markdown-lite body into safe display blocks:
 * blank-line-separated paragraphs, "## "/"### " headings, "- " bullet lists
 * and [text](url) inline links. Everything else stays plain text, which keeps
 * the rendered output free of raw HTML.
 */
export function parseBlogBody(body: string): BlogBlock[] {
  const lines = body.replace(/\r\n?/g, "\n").replace(/\u0000/g, "").split("\n").slice(0, 600);
  const blocks: BlogBlock[] = [];
  let paragraph: string[] = [];
  let list: InlineToken[][] = [];

  const flushParagraph = () => {
    if (paragraph.length && blocks.length < 300) {
      const text = paragraph.join(" ").trim();
      if (text) blocks.push({ type: "p", tokens: inlineTokens(text) });
    }
    paragraph = [];
  };
  const flushList = () => {
    if (list.length && blocks.length < 300) blocks.push({ type: "ul", items: list.slice(0, 40) });
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", text: heading[2].slice(0, 200) });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      list.push(inlineTokens(line.replace(/^[-*]\s+/, "").slice(0, 400)));
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

export function estimateReadTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 210))} min`;
}

export function formatBlogDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
