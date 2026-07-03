// Génère les icônes PWA depuis un SVG soleil (npx node scripts/gen-icons.mjs)
import sharp from "sharp";
import { mkdirSync } from "fs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="#fbbf24"/>
  <circle cx="256" cy="256" r="104" fill="#fffbeb"/>
  <g stroke="#fffbeb" stroke-width="30" stroke-linecap="round">
    <line x1="256" y1="72"  x2="256" y2="122"/>
    <line x1="256" y1="390" x2="256" y2="440"/>
    <line x1="72"  y1="256" x2="122" y2="256"/>
    <line x1="390" y1="256" x2="440" y2="256"/>
    <line x1="126" y1="126" x2="161" y2="161"/>
    <line x1="351" y1="351" x2="386" y2="386"/>
    <line x1="126" y1="386" x2="161" y2="351"/>
    <line x1="351" y1="161" x2="386" y2="126"/>
  </g>
</svg>`;

mkdirSync("public/icons", { recursive: true });
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`icon-${size}.png ✓`);
}
