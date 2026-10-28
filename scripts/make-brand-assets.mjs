// Gera icone e splash a partir do logo oficial do site (acessanet-lab/src/assets).
import sharp from "sharp";
const logo = "../acessanet-lab/src/assets/logo-acessanet-3d.png";
const navy = { r: 5, g: 11, b: 31, alpha: 1 };
const meta = await sharp(logo).metadata();
console.log(meta.width, meta.height, meta.orientation);
const globeW = Math.round(meta.width * 0.5);
const globe = await sharp(logo).extract({ left: 0, top: 0, width: globeW, height: meta.height }).toBuffer().then((b) => sharp(b).trim().toBuffer());

async function onCanvas(size, inner, bg) {
  const img = await sharp(globe).resize(inner, inner, { fit: "inside" }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: img, gravity: "center" }]).png();
}
await (await onCanvas(1024, 760, navy)).toFile("assets/icon-only.png");
await (await onCanvas(1024, 560, { r: 0, g: 0, b: 0, alpha: 0 })).toFile("assets/icon-foreground.png");
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: navy } }).png().toFile("assets/icon-background.png");
const full = await sharp(logo).resize(1300, null, { fit: "inside" }).toBuffer();
for (const name of ["splash", "splash-dark"]) {
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: navy } })
    .composite([{ input: full, gravity: "center" }]).png().toFile(`assets/${name}.png`);
}
