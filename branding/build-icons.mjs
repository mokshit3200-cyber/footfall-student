// Builds Cmpus app assets from the approved TRANSPARENT mark PNG.
// No background keying — the source already has clean alpha. We only
// recolor (white / charcoal) by keeping the source alpha, then resize
// and composite onto the exact brand-emerald tile.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const SRC = path.join(ROOT, "branding", "source", "mark-transparent.png");
const PUB = path.join(ROOT, "public");
const BRAND = path.join(PUB, "brand");
const EXPORT = path.join(ROOT, "branding", "export");
mkdirSync(BRAND, { recursive: true });
mkdirSync(EXPORT, { recursive: true });

const EMERALD = { r: 0x0b, g: 0x6b, b: 0x52 }; // #0B6B52

// Trim transparent border so the mark fills its box predictably.
const trimmed = await sharp(SRC).trim().toBuffer();
const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

// Recolor keeping the source alpha (preserves anti-aliased edges).
const whiteRGBA = Buffer.alloc(width * height * 4);
const darkRGBA = Buffer.alloc(width * height * 4);
for (let i = 0, p = 0; i < data.length; i += channels, p += 4) {
  const a = data[i + 3];
  whiteRGBA[p] = 255; whiteRGBA[p + 1] = 255; whiteRGBA[p + 2] = 255; whiteRGBA[p + 3] = a;
  darkRGBA[p] = 0x1a; darkRGBA[p + 1] = 0x1d; darkRGBA[p + 2] = 0x1b; darkRGBA[p + 3] = a;
}
const markWhite = sharp(whiteRGBA, { raw: { width, height, channels: 4 } }).png();
const markDark = sharp(darkRGBA, { raw: { width, height, channels: 4 } }).png();

// Clean transparent marks for in-app use.
await markWhite.clone().toFile(path.join(BRAND, "mark-white.png"));
await markDark.clone().toFile(path.join(BRAND, "mark-charcoal.png"));
await markWhite.clone().toFile(path.join(EXPORT, "mark-white.png"));
await markDark.clone().toFile(path.join(EXPORT, "mark-charcoal.png"));

// Emerald app-icon tile: white mark centered, optional rounded corners.
async function emeraldIcon(size, padRatio, radiusRatio, outPath) {
  const inner = Math.round(size * (1 - padRatio * 2));
  const markPng = await markWhite
    .clone()
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  let tileBuf = await sharp({
    create: { width: size, height: size, channels: 4, background: { ...EMERALD, alpha: 1 } },
  }).png().toBuffer();
  if (radiusRatio > 0) {
    const r = Math.round(size * radiusRatio);
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`
    );
    tileBuf = await sharp(tileBuf).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  }
  await sharp(tileBuf).composite([{ input: markPng, gravity: "centre" }]).png().toFile(outPath);
}

const rounded = [
  ["icon-512.png", 512], ["icon-192.png", 192], ["apple-touch-icon.png", 180],
  ["icon-167.png", 167], ["icon-152.png", 152], ["icon-120.png", 120],
  ["favicon-32.png", 32], ["favicon-16.png", 16],
];
for (const [name, size] of rounded) await emeraldIcon(size, 0.22, 0.22, path.join(PUB, name));
await emeraldIcon(512, 0.30, 0, path.join(PUB, "maskable-512.png")); // full-bleed for OS masking

console.log("Built icons from transparent mark:", width, "x", height);
