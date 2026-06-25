import sharp from "sharp";
const SRC = "branding/source/mark-transparent.png";
const m = await sharp(SRC).metadata();
console.log("meta:", { width: m.width, height: m.height, channels: m.channels, hasAlpha: m.hasAlpha });
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
let transparent = 0, opaque = 0, total = width * height;
for (let i = 0; i < data.length; i += channels) {
  const a = data[i + 3];
  if (a < 16) transparent++; else if (a > 240) opaque++;
}
console.log("corner alpha:", data[3], data[(width - 1) * channels + 3]);
console.log(`transparent px: ${(transparent / total * 100).toFixed(1)}%  opaque: ${(opaque / total * 100).toFixed(1)}%`);
