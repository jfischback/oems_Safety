// Run with: node scripts/build-pages.mjs
// Writes index.html (the list), one folder per calculator (e.g. fall-clearance/index.html),
// and vercel.json, which also serves each page at its underscore name (e.g. /fall_clearance/).
// The OEMS banner (partials/topbar.html) and first-visit agreement (partials/gate.html,
// disclaimer.js, disclaimer.css) match the IH calculators (copied from the APF calculator); the agreement text is for safety.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { CALCULATORS, GROUPS } from "../calculators.js";

const root = new URL("../", import.meta.url);
const read = p => readFileSync(new URL(p, root), "utf8");
const GATE = read("partials/gate.html");
const TOPBAR = read("partials/topbar.html");
const DISCLAIMER = "For estimation only. Not a substitute for a fall protection system design, rigging or lift plan, or evaluation by a competent or qualified person. Always use the manufacturer’s ratings, load charts and instructions for your equipment. Federal rules are shown; state requirements may be more stringent.";
const COPYRIGHT = '<p class="copyright">© 2026 Occupational Exposure Management Systems LLC. All rights reserved.</p>';

const page = (title, bodyAttrs, main, depth) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${depth}style.css">
<link rel="stylesheet" href="${depth}disclaimer.css">
<script>try { if (localStorage.getItem("oems_saf_disclaimer_v1")) document.documentElement.classList.add("oems-agreed"); } catch (e) {}</script>
</head>
<body${bodyAttrs}>
${GATE.replace('src="disclaimer.js"', `src="${depth}disclaimer.js"`)}
${TOPBAR}
${main}
</body>
</html>
`;

for (const c of CALCULATORS) {
  mkdirSync(new URL(`${c.slug}/`, root), { recursive: true });
  writeFileSync(new URL(`${c.slug}/index.html`, root), page(
    `${c.name} | OEMS Safety Calculators`,
    ` data-slug="${c.slug}"`,
    `<main>
<div id="calc"></div>
<p class="disclaimer">${DISCLAIMER}</p>
${COPYRIGHT}
</main>
<script type="module" src="../app.js"></script>`,
    "../"));
}

const list = GROUPS.map(g => `<h2>${g}</h2>
<ul class="list">
${CALCULATORS.filter(c => c.group === g).map(c => `<li><a href="${c.slug}/">${c.name}</a></li>`).join("\n")}
</ul>`).join("\n");

writeFileSync(new URL("index.html", root), page("OEMS Safety Calculators", "", `<main>
<h1>Safety Calculators</h1>
<p class="how">Each calculator solves for whichever value you leave blank.</p>
${list}
<p class="disclaimer">${DISCLAIMER}</p>
${COPYRIGHT}
</main>`, ""));

const aliases = CALCULATORS.map(c => c.slug).sort().map(slug => [slug.replace(/-/g, "_"), slug]);
writeFileSync(new URL("vercel.json", root), JSON.stringify({
  redirects: aliases.map(([u]) => ({ source: `/${u}`, destination: `/${u}/`, permanent: false })),
  rewrites: [
    ...aliases.map(([u, slug]) => ({ source: `/${u}/`, destination: `/${slug}/index.html` })),
    ...aliases.map(([u, slug]) => ({ source: `/${u}/:path+`, destination: `/${slug}/:path+` })),
  ],
}, null, 2) + "\n");

console.log(`Wrote index.html, vercel.json and ${CALCULATORS.length} calculator pages`);
