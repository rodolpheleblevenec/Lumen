// Génère les icônes PWA depuis la marque « Le Levant » (npx node scripts/gen-icons.mjs)
// Tuile indigo, soleil levant : demi-cercle corail + horizon et rayons crème.
import sharp from "sharp";
import { mkdirSync } from "fs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#4338ca"/>
  <path d="M128 320a128 128 0 0 1 256 0Z" fill="#e2543a"/>
  <path d="M75 320h362" stroke="#f6f3ec" stroke-width="34" stroke-linecap="round"/>
  <path d="M256 90v49M124 145l36 36M388 145l-36 36" stroke="#f6f3ec" stroke-width="34" stroke-linecap="round"/>
</svg>`;

mkdirSync("public/icons", { recursive: true });
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`icon-${size}.png ✓`);
}

// Icône iOS (convention Next : src/app/apple-icon.png), dérivée du
// favicon src/app/icon.svg (traits épaissis pour les petites tailles)
import { readFileSync } from "fs";
const favicon = readFileSync("src/app/icon.svg");
await sharp(favicon).resize(180, 180).png().toFile("src/app/apple-icon.png");
console.log("apple-icon.png ✓");
