// Run with: node tests/check.mjs
// 1. Each calculator's main answer must match the Safety Calculations Google Sheet.
// 2. Leaving each variable blank in turn must solve back to its example value.
// 3. Threshold checks must give the Sheet's YES/NO, and the warnings must trip at their limits.
import { readFileSync } from "node:fs";
import { CALCULATORS } from "../calculators.js";
import { solveBlank } from "../solver.js";
import { DIAGRAMS } from "../diagram.js";

const sheet = JSON.parse(readFileSync(new URL("./sheet-values.json", import.meta.url)));
// The Sheet shows 10 significant figures.
const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
const byslug = Object.fromEntries(CALCULATORS.map(c => [c.slug, c]));
let failures = 0, checks = 0;
const expect = (ok, text) => { checks++; if (!ok) { failures++; console.log(`FAIL ${text}`); } };

for (const calc of CALCULATORS) {
  const s = sheet[calc.slug];
  const full = { ...calc.example };
  full[calc.primary] = calc.solve[calc.primary](full);
  expect(s && close(full[calc.primary], s.primaryValue), `${calc.slug}: ${calc.primary} = ${full[calc.primary]}, Sheet says ${s?.primaryValue}`);

  if (calc.check) {
    const yes = calc.check.test(full[calc.primary], s.checkValue) ? "YES" : "NO";
    expect(yes === s.checkResult, `${calc.slug}: threshold check ${yes}, Sheet says ${s.checkResult}`);
  }

  for (const v of calc.vars) {
    const given = { ...full };
    delete given[v.k];
    try {
      const { value } = solveBlank(calc, given);
      expect(close(value, full[v.k]), `${calc.slug}: solving ${v.k} gave ${value}, expected ${full[v.k]}`);
    } catch (e) {
      expect(false, `${calc.slug}: solving ${v.k} threw "${e.message}"`);
    }
  }
}

// Every page needs a Sheet value, and the solver must refuse zero or two blanks.
expect(Object.keys(sheet).length === CALCULATORS.length, "every calculator has a Sheet value");
const trir = byslug.trir;
for (const values of [{ N: 5, EH: 400000, TRIR: 2.5 }, { N: 5 }]) {
  let threw = false;
  try { solveBlank(trir, values); } catch { threw = true; }
  expect(threw, `trir: ${Object.keys(values).length} values given should be refused`);
}

// Two-part center of gravity (W3 = 0) still solves.
const cg = byslug["center-of-gravity"];
expect(close(cg.solve.X({ W1: 1000, X1: 2, W2: 1000, X2: 6, W3: 0, X3: 0 }), 4), "cg: two equal parts balance halfway");

// Fall clearance check edges and warnings.
const fc = byslug["fall-clearance"].check;
expect(fc.test(17.5, 17.5) === true, "fall clearance: available equal to required is adequate");
expect(fc.test(17.5, 17.4) === false, "fall clearance: less than required is not adequate");
const sling = byslug["sling-tension"], crane = byslug["crane-capacity"];
expect(sling.warn({ theta: 30 }) === null, "sling: 30° is allowed");
expect(sling.warn({ theta: 29.9 })?.flag === true, "sling: below 30° is flagged");
expect(crane.warn({ P: 100 }) === null, "crane: 100% is at capacity, not over");
expect(crane.warn({ P: 100.1 })?.flag === true, "crane: over 100% is flagged");
expect(close(sling.solve.T({ W: 2000, n: 2, theta: 90 }), 1000), "sling: vertical legs share the load evenly");

// Every diagram draws for its example values, and for some awkward ones.
const awkward = {
  "fall-clearance": [{ check: 12 }, { check: 200 }, { check: undefined }],
  "sling-tension": [{ theta: 90 }, { theta: 15 }, { n: 4 }],
  "center-of-gravity": [{ W3: 0 }, { X1: 0 }, { X3: 40 }],
};
for (const [slug, draw] of Object.entries(DIAGRAMS)) {
  const c = byslug[slug], s = sheet[slug];
  for (const extra of [{}, ...(awkward[slug] || [])]) {
    const inputs = { ...c.example, ...extra };
    delete inputs.check;
    const v = { ...inputs, [c.primary]: c.solve[c.primary](inputs), check: "check" in extra ? extra.check : s.checkValue };
    for (const w of [320, 700]) {
      const svg = draw(v, w);
      expect(typeof svg === "string" && !svg.includes("NaN") && !svg.includes("Infinity"), `${slug}: diagram draws at ${w}px for ${JSON.stringify(extra)}`);
    }
  }
}

console.log(`${CALCULATORS.length} calculators, ${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
