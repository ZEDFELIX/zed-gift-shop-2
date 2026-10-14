import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC =
  process.argv[2] ?? "C:/Users/User/Downloads/ZED Luxury Gift Shop Logo.png";

// Website palette: deep plum text, rose accents.
const PLUM_DARK = [44, 19, 38]; // #2C1326
const PLUM_MID = [139, 58, 122]; // #8B3A7A
const ROSE_HUE = 335.6; // #E5397F
const PLUM_HUE = 314.5; // #6B2D5C

function hueOf(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (d === 0) return 0;
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function rgbToHsv(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  return {
    h: hueOf(r, g, b),
    s: mx === 0 ? 0 : d / mx,
    v: mx / 255,
  };
}

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function recolor(buf) {
  for (let i = 0; i < buf.length; i += 4) {
    const a = buf[i + 3];
    if (a === 0) continue;

    // The source PNG carries chromatic noise in its soft glow/edges.
    // Blend low-alpha pixels toward white so the halo stays clean.
    if (a < 150) {
      const t = a / 150;
      buf[i] = Math.round(255 - (255 - buf[i]) * t);
      buf[i + 1] = Math.round(255 - (255 - buf[i + 1]) * t);
      buf[i + 2] = Math.round(255 - (255 - buf[i + 2]) * t);
      if (a < 70) continue;
    }

    const { h, s, v } = rgbToHsv(buf[i], buf[i + 1], buf[i + 2]);

    if (s > 0.18) {
      // Saturated pixels: gold becomes rose, anything else becomes plum.
      // Saturation is capped so saturated noise cannot produce pure red.
      const targetHue = h >= 8 && h <= 72 ? ROSE_HUE : PLUM_HUE;
      const [nr, ng, nb] = hsvToRgb(targetHue, Math.min(s, 0.8), v);
      buf[i] = nr;
      buf[i + 1] = ng;
      buf[i + 2] = nb;
    } else if (v >= 0.75) {
      // Pale neutral fringe in the glow is pulled toward white so it cannot
      // read as red/yellow speckle.
      const f = Math.min((v - 0.75) / 0.25, 1) * 0.9;
      buf[i] = Math.round(buf[i] + (255 - buf[i]) * f);
      buf[i + 1] = Math.round(buf[i + 1] + (255 - buf[i + 1]) * f);
      buf[i + 2] = Math.round(buf[i + 2] + (255 - buf[i + 2]) * f);
    } else if (v < 0.8) {
      // Neutral dark/mid pixels ramp between the two plums.
      const t = 0.3 + 0.7 * Math.min(v / 0.8, 1);
      buf[i] = Math.round(PLUM_DARK[0] + t * (PLUM_MID[0] - PLUM_DARK[0]));
      buf[i + 1] = Math.round(PLUM_DARK[1] + t * (PLUM_MID[1] - PLUM_DARK[1]));
      buf[i + 2] = Math.round(PLUM_DARK[2] + t * (PLUM_MID[2] - PLUM_DARK[2]));
    }
    // v >= 0.8 neutrals (white glow/highlights) stay as-is.
  }
}

function columnCoverage(alpha, width, height) {
  const cov = new Array(width).fill(0);
  for (let x = 0; x < width; x++) {
    let n = 0;
    for (let y = 0; y < height; y++) {
      if (alpha[y * width + x] > 30) n++;
    }
    cov[x] = n;
  }
  return cov;
}

async function main() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) throw new Error(`Expected RGBA, got ${channels} channels`);

  recolor(data);

  const outDir = path.join(root, "public");
  await mkdir(outDir, { recursive: true });
  await mkdir(path.join(root, "src", "app"), { recursive: true });

  // Full lockup for header/footer.
  const logoWidth = 1120;
  const logo = await sharp(data, { raw: { width, height, channels: 4 } })
    .resize({ width: logoWidth })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(logo).toFile(path.join(outDir, "logo.png"));

  // Locate the gift-box mark: first empty column run after the mark begins.
  const alpha = data.filter((_, i) => i % 4 === 3);
  const cov = columnCoverage(alpha, width, height);
  let gapStart = -1;
  let runStart = -1;
  for (let x = 100; x < width - 100; x++) {
    if (cov[x] < 4) {
      if (runStart < 0) runStart = x;
      if (x - runStart >= 24) {
        gapStart = runStart;
        break;
      }
    } else {
      runStart = -1;
    }
  }
  if (gapStart < 0) gapStart = Math.round(width * 0.36);

  let x0 = 0;
  let x1 = gapStart;
  let y0 = height;
  let y1 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = x0; x < x1; x++) {
      if (alpha[y * width + x] > 30) {
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  for (let x = x0; x < x1; x++) {
    if (cov[x] > 0) x1 = Math.max(x1, x);
  }
  console.log(`mark bbox: x ${x0}..${x1}, y ${y0}..${y1} (gap at ${gapStart})`);

  const markW = x1 - x0;
  const markH = y1 - y0;

  const raw = { width, height, channels: 4 };

  async function iconFile(file, size, { rounded, fullBleed }) {
    const pad = Math.round(size * 0.13);
    const box = size - pad * 2;
    const scale = box / Math.max(markW, markH);
    const mw = Math.round(markW * scale);
    const mh = Math.round(markH * scale);
    const mark = await sharp(data, { raw })
      .extract({ left: x0, top: y0, width: markW, height: markH })
      .resize(mw, mh)
      .png()
      .toBuffer();

    const rx = fullBleed ? 0 : Math.round(size * 0.19);
    const bg = Buffer.from(
      `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${rx}" fill="#FFFFFF"/></svg>`,
    );
    const composed = await sharp(bg)
      .composite([
        {
          input: mark,
          left: Math.round((size - mw) / 2),
          top: Math.round((size - mh) / 2),
        },
      ])
      .png()
      .toBuffer();
    await sharp(composed).toFile(file);
    console.log(`wrote ${file}`);
  }

  await iconFile(path.join(root, "src", "app", "icon.png"), 512, {
    rounded: true,
  });
  await iconFile(path.join(root, "src", "app", "apple-icon.png"), 180, {
    fullBleed: true,
  });
  await iconFile(path.join(outDir, "icon-192.png"), 192, { fullBleed: true });
  await iconFile(path.join(outDir, "icon-512.png"), 512, { fullBleed: true });

  console.log(`wrote ${path.join(outDir, "logo.png")} (${logo.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
