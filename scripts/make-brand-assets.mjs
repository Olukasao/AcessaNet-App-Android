// Gera ícone e splash do app a partir de assets/logo.png (arte quadrada oficial, 512x512, fundo azul-escuro próprio).
// Saídas em assets/ (consumidas por `npx capacitor-assets generate --android`).
import sharp from "sharp";

const SRC = "assets/logo.png";
const SIZE = 1024;
const logo = (size) => sharp(SRC).resize(size, size, { kernel: "lanczos3" });

// Ícone completo (iOS/legado): a arte inteira.
await logo(SIZE).png().toFile("assets/icon-only.png");

// Ícone adaptativo do Android: a máscara do launcher mostra só ~66% central (círculo, quadrado arredondado...).
// Primeiro plano = a arte a ~68% (o texto e o globo cabem na zona segura); fundo = a mesma arte ampliada e borrada,
// para a emenda ficar invisível.
const fgSize = Math.round(SIZE * 0.68);
const fg = await logo(fgSize).png().toBuffer();
await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: fg, gravity: "center" }])
  .png()
  .toFile("assets/icon-foreground.png");
await logo(SIZE).blur(48).png().toFile("assets/icon-background.png");

// Splash: degradê azul-escuro da marca; a arte fica no centro com as bordas dissolvidas nele (sem cartão quadrado).
const SPLASH = 2732;
const bg = Buffer.from(
  `<svg width="${SPLASH}" height="${SPLASH}"><defs><radialGradient id="g" cx="50%" cy="46%" r="75%">` +
    `<stop offset="0%" stop-color="#06308a"/><stop offset="45%" stop-color="#021a52"/><stop offset="100%" stop-color="#00081f"/>` +
    `</radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
);
const art = 1500;
const fade = Buffer.from(
  `<svg width="${art}" height="${art}"><circle cx="${art / 2}" cy="${art / 2}" r="${art * 0.36}" fill="#fff"/></svg>`
);
const softMask = await sharp(fade).blur(110).png().toBuffer();
const centered = await sharp(SRC)
  .resize(art, art, { kernel: "lanczos3" })
  .ensureAlpha()
  .composite([{ input: softMask, blend: "dest-in" }])
  .png()
  .toBuffer();
for (const name of ["splash", "splash-dark"]) {
  await sharp(bg).composite([{ input: centered, gravity: "center" }]).png().toFile(`assets/${name}.png`);
}
console.log("ok");
