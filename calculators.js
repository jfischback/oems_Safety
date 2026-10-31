// Safety calculator definitions.
// Each calculator lists its variables, a closed-form solution for each variable,
// and a "residual" (left side minus right side of the equation) as a fallback.
// Some also have a "check" that compares the answer to a value the user enters,
// or a "warn" that flags an answer outside the accepted limit.
// Equations follow the SAF tabs of the Safety Calculations Google Sheet.

const RAD = Math.PI / 180;
const sin = d => Math.sin(d * RAD);
const asin = x => Math.asin(x) / RAD;

// The three OSHA/BLS incidence rates share one formula and differ only in which cases are counted.
const incidenceRate = ({ slug, name, k, rateLabel, cases }) => ({
  slug, name, group: "Injury and illness rates",
  source: "OSHA/BLS incidence rate formula (OSHA recordkeeping, 29 CFR 1904)",
  equation: `${k} = N × 200,000 / EH`,
  note: "200,000 hours is 100 full-time employees working 40 hours a week, 50 weeks a year.",
  vars: [
    { k: "N", label: `N, ${cases}`, unit: "cases" },
    { k: "EH", label: "EH, total hours worked by all employees in the year", unit: "hours" },
    { k, label: `${k}, ${rateLabel}`, unit: "cases per 200,000 hr" },
  ],
  solve: {
    N: v => v[k] * v.EH / 200000,
    EH: v => v.N * 200000 / v[k],
    [k]: v => v.N * 200000 / v.EH,
  },
  residual: v => v[k] - v.N * 200000 / v.EH,
  primary: k,
});

export const CALCULATORS = [
  // ---------- Injury and illness rates ----------
  {
    ...incidenceRate({
      slug: "trir", name: "Total Recordable Incident Rate (TRIR)", k: "TRIR",
      rateLabel: "total recordable incident rate",
      cases: "number of OSHA recordable injuries and illnesses",
    }),
    example: { N: 5, EH: 400000 },
  },
  {
    ...incidenceRate({
      slug: "dart-rate", name: "DART Rate (Days Away, Restricted or Transferred)", k: "DART",
      rateLabel: "DART rate",
      cases: "number of recordable cases with days away from work, restricted work or job transfer",
    }),
    example: { N: 3, EH: 400000 },
  },
  {
    ...incidenceRate({
      slug: "lost-time-rate", name: "Lost Time Case Rate (LTCR)", k: "LTCR",
      rateLabel: "lost time case rate",
      cases: "number of recordable cases with days away from work",
    }),
    example: { N: 2, EH: 400000 },
  },

  // ---------- Fall protection ----------
  {
    slug: "fall-clearance", name: "Required Fall Clearance (Personal Fall Arrest)", group: "Fall protection",
    source: "Standard fall clearance sum used by fall protection manufacturers; limits from 29 CFR 1910.140(d)(1)(ii) and (d)(2)(ii)",
    equation: "RC = LL + DD + DS + WH + SF",
    note: "OSHA limits free fall to 6 ft and deceleration distance to 3.5 ft, and the worker must not contact a lower level. Use the manufacturer’s figures for DD and DS.",
    vars: [
      { k: "LL", label: "LL, lanyard length", unit: "ft" },
      { k: "DD", label: "DD, deceleration distance (OSHA max 3.5 ft)", unit: "ft" },
      { k: "DS", label: "DS, harness stretch and D-ring shift (from the manufacturer)", unit: "ft" },
      { k: "WH", label: "WH, distance from the D-ring to the worker’s feet", unit: "ft" },
      { k: "SF", label: "SF, safety margin (your choice)", unit: "ft" },
      { k: "RC", label: "RC, required clearance below the anchor point", unit: "ft" },
    ],
    solve: {
      LL: v => v.RC - v.DD - v.DS - v.WH - v.SF,
      DD: v => v.RC - v.LL - v.DS - v.WH - v.SF,
      DS: v => v.RC - v.LL - v.DD - v.WH - v.SF,
      WH: v => v.RC - v.LL - v.DD - v.DS - v.SF,
      SF: v => v.RC - v.LL - v.DD - v.DS - v.WH,
      RC: v => v.LL + v.DD + v.DS + v.WH + v.SF,
    },
    residual: v => v.RC - v.LL - v.DD - v.DS - v.WH - v.SF,
    primary: "RC", example: { LL: 6, DD: 3.5, DS: 1, WH: 5, SF: 2 },
    check: {
      label: "Clearance available below the anchor (optional)", unit: "ft", default: 20,
      test: (rc, available) => available >= rc, flagIfYes: false,
      yes: "Adequate: the clearance available is at least the required clearance.",
      no: "Not adequate: the worker could strike the lower level. Raise the anchor or use a shorter lanyard or a self-retracting lifeline.",
    },
  },

  // ---------- Rigging and lifting ----------
  {
    slug: "sling-tension", name: "Sling Leg Tension with Sling Angle", group: "Rigging and lifting",
    source: "ASME B30.9 sling angle relationship (load angle factor = 1/sin θ)",
    equation: "T = W / (n × sin θ)",
    note: "θ is measured from the horizontal. 1/sin θ is the load angle factor. Assumes equal leg angles and the load shared equally; three- and four-leg slings may not share the load evenly. ASME B30.9 does not allow sling angles below 30° unless approved by the sling manufacturer or a qualified person.",
    vars: [
      { k: "W", label: "W, load weight", unit: "lb" },
      { k: "n", label: "n, number of sling legs sharing the load", unit: "legs" },
      { k: "theta", label: "θ, sling angle from horizontal", unit: "degrees" },
      { k: "T", label: "T, tension in each sling leg", unit: "lb per leg" },
    ],
    solve: {
      W: v => v.T * v.n * sin(v.theta),
      n: v => v.W / (v.T * sin(v.theta)),
      theta: v => asin(v.W / (v.n * v.T)),
      T: v => v.W / (v.n * sin(v.theta)),
    },
    residual: v => v.T - v.W / (v.n * sin(v.theta)),
    primary: "T", example: { W: 2000, n: 2, theta: 60 },
    warn: v => v.theta < 30
      ? { flag: true, text: "Sling angle below 30°: not allowed by ASME B30.9 unless approved by the sling manufacturer or a qualified person." }
      : null,
  },
  {
    slug: "center-of-gravity", name: "Center of Gravity (Combined Load)", group: "Rigging and lifting",
    source: "Statics: principle of moments (sum of moments about the reference end divided by total weight)",
    equation: "X = (W1 × X1 + W2 × X2 + W3 × X3) / (W1 + W2 + W3)",
    note: "Measure every distance from the same reference end. For two parts, set W3 to 0.",
    vars: [
      { k: "W1", label: "W1, weight of part 1", unit: "lb" },
      { k: "X1", label: "X1, distance to the center of part 1", unit: "ft" },
      { k: "W2", label: "W2, weight of part 2", unit: "lb" },
      { k: "X2", label: "X2, distance to the center of part 2", unit: "ft" },
      { k: "W3", label: "W3, weight of part 3 (0 if none)", unit: "lb" },
      { k: "X3", label: "X3, distance to the center of part 3", unit: "ft" },
      { k: "X", label: "X, center of gravity from the reference end", unit: "ft" },
    ],
    solve: {
      W1: v => (v.W2 * (v.X2 - v.X) + v.W3 * (v.X3 - v.X)) / (v.X - v.X1),
      X1: v => (v.X * (v.W1 + v.W2 + v.W3) - v.W2 * v.X2 - v.W3 * v.X3) / v.W1,
      W2: v => (v.W1 * (v.X1 - v.X) + v.W3 * (v.X3 - v.X)) / (v.X - v.X2),
      X2: v => (v.X * (v.W1 + v.W2 + v.W3) - v.W1 * v.X1 - v.W3 * v.X3) / v.W2,
      W3: v => (v.W1 * (v.X1 - v.X) + v.W2 * (v.X2 - v.X)) / (v.X - v.X3),
      X3: v => (v.X * (v.W1 + v.W2 + v.W3) - v.W1 * v.X1 - v.W2 * v.X2) / v.W3,
      X: v => (v.W1 * v.X1 + v.W2 * v.X2 + v.W3 * v.X3) / (v.W1 + v.W2 + v.W3),
    },
    residual: v => v.X - (v.W1 * v.X1 + v.W2 * v.X2 + v.W3 * v.X3) / (v.W1 + v.W2 + v.W3),
    primary: "X", example: { W1: 1000, X1: 2, W2: 500, X2: 6, W3: 250, X3: 10 },
  },
  {
    slug: "crane-capacity", name: "Crane Capacity Percentage", group: "Rigging and lifting",
    source: "ASME B30.5 (rated load from the manufacturer’s load chart)",
    equation: "P = WL / RC × 100",
    note: "Include the rigging, hook block and attachments in WL. Read RC from the load chart at the lift’s radius and configuration.",
    vars: [
      { k: "WL", label: "WL, total lifted load, including rigging, hook block and attachments", unit: "lb" },
      { k: "RC", label: "RC, rated capacity from the load chart at the lift’s radius and configuration", unit: "lb" },
      { k: "P", label: "P, percent of rated capacity used", unit: "%" },
    ],
    solve: {
      WL: v => v.P * v.RC / 100,
      RC: v => v.WL * 100 / v.P,
      P: v => v.WL / v.RC * 100,
    },
    residual: v => v.P - v.WL / v.RC * 100,
    primary: "P", example: { WL: 8000, RC: 10000 },
    warn: v => v.P > 100
      ? { flag: true, text: "Over capacity: the load exceeds the rated capacity on the load chart. Do not make this lift." }
      : null,
  },
];

export const GROUPS = ["Injury and illness rates", "Fall protection", "Rigging and lifting"];
