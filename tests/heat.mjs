// Checks the heat stress math against hand calculations and published reference values.
import { ral, rel, wbgt, hourTwa, heatIndexF, nioshScreen, oshaFromHeatIndex, oshaFromWbgt, fToC, KCAL_TO_W } from "../heat-stress/heat-calc.js";
let fails = 0, n = 0;
const near = (name, got, want, tol) => { n++; if (Math.abs(got - want) > tol) { fails++; console.log(`FAIL ${name}: got ${got}, want ${want}`); } };
const eq = (name, got, want) => { n++; if (got !== want) { fails++; console.log(`FAIL ${name}: got ${got}, want ${want}`); } };

// NIOSH equations (Section 8.1), hand calculated: log10(348.9) = 2.542701
near("REL at 348.9 W", rel(348.9), 56.7 - 11.5 * 2.542701, 1e-4);
near("RAL at 348.9 W", ral(348.9), 59.9 - 14.1 * 2.542701, 1e-4);
near("REL at 348.9 W = 27.46", rel(348.9), 27.46, 0.01);
near("RAL at 348.9 W = 24.05", ral(348.9), 24.05, 0.01);
near("REL at 100 W = 33.7", rel(100), 33.7, 1e-9);
near("RAL at 1000 W = 17.6", ral(1000), 17.6, 1e-9);
near("300 kcal/h to W", 300 * KCAL_TO_W, 348, 1e-9);

// WBGT (Section 9.3.2)
near("WBGT indoor", wbgt(25, 40, 0, false), 0.7 * 25 + 0.3 * 40, 1e-9);
near("WBGT outdoor sun", wbgt(25, 40, 30, true), 17.5 + 8 + 3, 1e-9);

// 1-hour TWA: 45 min at 30 C and 400 W, 15 min at 24 C and 120 W
near("TWA WBGT", hourTwa(45, 30, 24), (30 * 45 + 24 * 15) / 60, 1e-9);
near("TWA M", hourTwa(45, 400, 120), (400 * 45 + 120 * 15) / 60, 1e-9);
const s = nioshScreen({ workMin: 45, wbgtWork: 30, wbgtRest: 24, mWork: 400, mRest: 120, acclimatized: true });
near("screen TWA WBGT 28.5", s.twaWbgt, 28.5, 1e-9);
near("screen TWA M 330", s.twaM, 330, 1e-9);
near("screen REL at 330 W", s.limit, 56.7 - 11.5 * Math.log10(330), 1e-9);
eq("screen exceeds (28.5 > 27.74)", s.exceeds, true);
const s2 = nioshScreen({ workMin: 60, wbgtWork: 27, wbgtRest: 0, mWork: 330, mRest: 0, acclimatized: true });
eq("27.0 does not exceed REL 27.74", s2.exceeds, false);
const s3 = nioshScreen({ workMin: 60, wbgtWork: 27, wbgtRest: 0, mWork: 330, mRest: 0, acclimatized: false });
eq("unacclimatized uses RAL", s3.limitName, "RAL");
eq("27.0 exceeds RAL 24.38", s3.exceeds, true);

// NWS heat index: regression recomputed independently (coefficients from the NWS Weather Prediction Center page)
const rothfusz = (t, rh) => -42.379 + 2.04901523*t + 10.14333127*rh - .22475541*t*rh - .00683783*t*t - .05481717*rh*rh + .00122874*t*t*rh + .00085282*t*rh*rh - .00000199*t*t*rh*rh;
near("HI 80F 40% uses simple formula", heatIndexF(80, 40), 0.5 * (80 + 61 + 12 * 1.2 + 40 * 0.094), 1e-9);
for (const [t, rh] of [[90, 50], [100, 40], [94, 55], [110, 40]]) near(`HI ${t}F ${rh}%`, heatIndexF(t, rh), rothfusz(t, rh), 1e-9);
// High humidity adjustment: 84 F, 90% RH
near("HI high RH adjustment", heatIndexF(84, 90), rothfusz(84, 90) + ((90 - 85) / 10) * ((87 - 84) / 5), 1e-9);
// Simple formula branch: 70 F 50% -> 0.5*(70+61+2.4+4.7) = 69.05
near("HI simple branch", heatIndexF(70, 50), 69.05, 1e-9);
// Low humidity adjustment: 100 F, 10% RH
{ const t = 100, rh = 10;
  const reg = -42.379 + 2.04901523*t + 10.14333127*rh - .22475541*t*rh - .00683783*t*t - .05481717*rh*rh + .00122874*t*t*rh + .00085282*t*rh*rh - .00000199*t*t*rh*rh;
  near("HI low RH adjustment", heatIndexF(t, rh), reg - ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17), 1e-9); }

// OSHA proposed triggers
eq("HI 79.9 below", oshaFromHeatIndex(79.9), "below");
eq("HI 80 initial", oshaFromHeatIndex(80), "initial");
eq("HI 89.9 initial", oshaFromHeatIndex(89.9), "initial");
eq("HI 90 high", oshaFromHeatIndex(90), "high");
eq("WBGT at RAL is initial", oshaFromWbgt(ral(330), 330), "initial");
eq("WBGT at REL is high", oshaFromWbgt(rel(330), 330), "high");
eq("WBGT under RAL is below", oshaFromWbgt(ral(330) - 0.01, 330), "below");
near("F to C", fToC(212), 100, 1e-9);

console.log(`${n - fails} of ${n} checks pass`);
process.exit(fails ? 1 : 0);
