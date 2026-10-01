// Validates every photo id used by the app and reports the broken ones.
const fs = require("fs");
const path = require("path");

const FILES = ["scripts/product-photo.ts", "scripts/demo-images-base.ts"];

const ids = new Set();
for (const f of FILES) {
  const s = fs.readFileSync(f, "utf8");
  // Unsplash ids always have the form photo-<13 digit timestamp>-<12 hex chars>.
  for (const m of s.matchAll(/photo-\d{10,}-[0-9a-f]{8,}/g)) ids.add(m[0]);
}

async function check(id) {
  const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=200&q=60`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    const ct = (res.headers.get("content-type") || "").split(";")[0];
    return { id, ok: res.ok && ct.startsWith("image/"), status: res.status, ct };
  } catch (e) {
    return { id, ok: false, status: "ERR", ct: String(e.message).slice(0, 40) };
  }
}

(async () => {
  const all = Array.from(ids);
  console.log(`checking ${all.length} ids...\n`);
  const results = [];
  const CONCURRENCY = 8;
  for (let i = 0; i < all.length; i += CONCURRENCY) {
    const batch = await Promise.all(all.slice(i, i + CONCURRENCY).map(check));
    results.push(...batch);
    for (const r of batch) if (!r.ok) console.log(`BAD ${String(r.status).padEnd(4)} ${r.ct.padEnd(16)} ${r.id}`);
  }
  const bad = results.filter((r) => !r.ok);
  console.log(`\nvalid ${results.length - bad.length}/${results.length}`);
  fs.writeFileSync(
    path.join("scripts", "photo-validation.json"),
    JSON.stringify({ checked: results.length, bad: bad.map((b) => b.id) }, null, 2),
  );
})();