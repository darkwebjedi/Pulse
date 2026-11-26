// Generates original gradient cover art (SVG) for the demo catalogue -> public/covers/*.svg
import { writeFileSync, mkdirSync } from "node:fs";

const covers = [
  ["midnight-circuits", "#7c3aed", "#ec4899", "#22d3ee"],
  ["low-light", "#1e1b4b", "#a855f7", "#f472b6"],
  ["glass-hours", "#0f172a", "#38bdf8", "#c084fc"],
  ["afterglow-protocol", "#4c1d95", "#f43f5e", "#fbbf24"],
  ["paper-satellites", "#312e81", "#818cf8", "#f0abfc"],
  ["slow-violet", "#581c87", "#d946ef", "#60a5fa"],
  ["heat-haze", "#7f1d1d", "#fb923c", "#f472b6"],
  ["cold-open", "#0c4a6e", "#2dd4bf", "#a78bfa"],
  ["static-bloom", "#831843", "#c026d3", "#38bdf8"],
  ["last-train", "#111827", "#6366f1", "#f0abfc"],
];

mkdirSync("public/covers", { recursive: true });
covers.forEach(([slug, a, b, c], i) => {
  const r = (n) => ((i * 37 + n * 53) % 100) / 100;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
<filter id="blur"><feGaussianBlur stdDeviation="38"/></filter>
</defs>
<rect width="600" height="600" fill="url(#g)"/>
<circle cx="${120 + r(1) * 360}" cy="${100 + r(2) * 300}" r="${140 + r(3) * 90}" fill="${c}" opacity=".75" filter="url(#blur)"/>
<circle cx="${100 + r(4) * 400}" cy="${300 + r(5) * 250}" r="${90 + r(6) * 80}" fill="${b}" opacity=".8" filter="url(#blur)"/>
<g fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2">
<circle cx="300" cy="300" r="${90 + (i % 4) * 22}"/>
<circle cx="300" cy="300" r="${150 + (i % 3) * 26}" stroke-opacity=".3"/>
<circle cx="300" cy="300" r="${210 + (i % 5) * 14}" stroke-opacity=".15"/>
</g>
<circle cx="300" cy="300" r="${14 + (i % 3) * 4}" fill="#fff" fill-opacity=".9"/>
</svg>`;
  writeFileSync(`public/covers/${slug}.svg`, svg);
});
console.log(`wrote ${covers.length} covers`);
