import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "public", "placeholders");
mkdirSync(dir, { recursive: true });

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function svg(label, accent = "#c9a56a") {
  const safe = escapeXml(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111110"/>
      <stop offset="0.55" stop-color="#242422"/>
      <stop offset="1" stop-color="#111110"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.6" stop-color="${accent}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="400" cy="400" r="300" fill="url(#glow)"/>
  <g stroke="${accent}" stroke-opacity="0.22" stroke-width="2">
    <path d="M-120 640 L920 -80"/>
    <path d="M-80 700 L960 -20"/>
    <path d="M-40 760 L1000 40"/>
  </g>
  <g fill="none" stroke="${accent}" stroke-width="6" opacity="0.9">
    <rect x="190" y="190" width="420" height="420" rx="28"/>
    <path d="M260 190 L190 260 M540 190 L610 260 M260 610 L190 540 M540 610 L610 540"/>
    <circle cx="400" cy="400" r="120"/>
    <path d="M400 330 L400 470 M330 400 L470 400"/>
  </g>
  <text x="400" y="620" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="bold" letter-spacing="3" fill="${accent}">${safe}</text>
  <text x="400" y="668" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" letter-spacing="10" fill="#ffffff" fill-opacity="0.75">ZED GIFT SHOP</text>
</svg>
`;
}

const products = Array.from({ length: 16 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return [`product-${n}`, `Gift ${i + 1}`];
});

const occasions = [
  "birthday", "anniversary", "graduation", "corporate", "valentines",
  "fathers-day", "wedding", "just-because", "love",
];
const recipients = ["him", "her", "couples", "friends", "parents", "colleagues"];
const collections = ["bestsellers", "new-arrivals", "corporate", "personalized-picks", "home-and-living", "gourmet"];

const palette = ["#c9a56a", "#c9a56a", "#94a294", "#dcd6ca", "#94a294", "#dcd6ca"];

for (const [name, label] of products) {
  writeFileSync(join(dir, `${name}.svg`), svg(label, "rgba(0,0,0,0)"));
}

function titleize(slug) {
  return slug
    .split("-")
    .map((w) => w[0] ? w[0].toUpperCase() + w.slice(1) : w)
    .join(" ");
}

occasions.forEach((name, i) => {
  writeFileSync(join(dir, `occasion-${name}.svg`), svg(titleize(name), palette[i % palette.length]));
});
recipients.forEach((name, i) => {
  writeFileSync(join(dir, `recipient-${name}.svg`), svg(`For ${titleize(name)}`, palette[(i + 2) % palette.length]));
});
collections.forEach((name, i) => {
  writeFileSync(join(dir, `collection-${name}.svg`), svg(titleize(name), palette[(i + 4) % palette.length]));
});

// Ensure correct accent for all product SVGs (rebuild with varied accents).
products.forEach(([name], i) => {
  writeFileSync(join(dir, `${name}.svg`), svg(`Gift ${i + 1}`, palette[i % palette.length]));
});

console.log(`Generated ${products.length + occasions.length + recipients.length + collections.length} placeholders in ${dir}`);