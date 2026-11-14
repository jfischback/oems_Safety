// Heat stress math. Every number here comes from a cited source; nothing is estimated.
//
// NIOSH: Criteria for a Recommended Standard, Occupational Exposure to Heat and Hot Environments,
//        DHHS (NIOSH) Publication 2016-106.
//   Section 8.1:   RAL [°C-WBGT] = 59.9 − 14.1 log10 M[W]   (unacclimatized workers)
//                  REL [°C-WBGT] = 56.7 − 11.5 log10 M[W]   (acclimatized workers)
//   Section 1.1.2-1.1.3: WBGT and metabolic heat are 1-hour TWAs that include all rest periods.
//   Section 1.1.3: 1 kcal/h = 1.16 W.
//   Section 9.3.2: WBGT indoors = 0.7 Tnwb + 0.3 Tg; outdoors in sun = 0.7 Tnwb + 0.2 Tg + 0.1 Ta.
// OSHA proposed rule, 29 CFR 1910.148 (published August 30, 2024; not final):
//   Initial heat trigger = heat index 80 °F, or a WBGT equal to the NIOSH RAL.
//   High heat trigger    = heat index 90 °F, or a WBGT equal to the NIOSH REL.
//   Heat index means the National Weather Service heat index.
// NWS heat index: Rothfusz regression (NWS Technical Attachment SR 90-23) as given by the
//   NWS Weather Prediction Center, including its simple formula and two adjustments.

export const KCAL_TO_W = 1.16;

export const fToC = f => (f - 32) * 5 / 9;
export const cToF = c => c * 9 / 5 + 32;

export function wbgt(nwb, globe, dry, outdoorSun) {
  return outdoorSun ? 0.7 * nwb + 0.2 * globe + 0.1 * dry : 0.7 * nwb + 0.3 * globe;
}

export const ral = mW => 59.9 - 14.1 * Math.log10(mW);
export const rel = mW => 56.7 - 11.5 * Math.log10(mW);

// One-hour time-weighted averages. workMin is minutes of work in the hour; the rest of the hour is rest.
export function hourTwa(workMin, workValue, restValue) {
  const restMin = 60 - workMin;
  return (workValue * workMin + (restMin > 0 ? restValue * restMin : 0)) / 60;
}

// NWS heat index, °F in and out, RH in percent.
export function heatIndexF(t, rh) {
  const simple = 0.5 * (t + 61.0 + (t - 68.0) * 1.2 + rh * 0.094);
  if ((simple + t) / 2 < 80) return simple;
  let hi = -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh
    - 0.00683783 * t * t - 0.05481717 * rh * rh + 0.00122874 * t * t * rh
    + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh;
  if (rh < 13 && t >= 80 && t <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
  else if (rh > 85 && t >= 80 && t <= 87) hi += ((rh - 85) / 10) * ((87 - t) / 5);
  return hi;
}

// NIOSH screen. Temperatures in °C-WBGT, metabolic rates in W.
export function nioshScreen({ workMin, wbgtWork, wbgtRest, mWork, mRest, acclimatized }) {
  const twaWbgt = hourTwa(workMin, wbgtWork, wbgtRest);
  const twaM = hourTwa(workMin, mWork, mRest);
  const r = { twaWbgt, twaM, ral: ral(twaM), rel: rel(twaM) };
  r.limitName = acclimatized ? "REL" : "RAL";
  r.limit = acclimatized ? r.rel : r.ral;
  r.exceeds = twaWbgt > r.limit; // NIOSH: not exposed to heat "greater than" the limit
  return r;
}

// OSHA proposed rule screen. Returns "below", "initial" or "high".
export function oshaFromHeatIndex(hiF) {
  if (hiF >= 90) return "high";
  if (hiF >= 80) return "initial";
  return "below";
}
export function oshaFromWbgt(twaWbgtC, twaM) {
  if (twaWbgtC >= rel(twaM)) return "high";
  if (twaWbgtC >= ral(twaM)) return "initial";
  return "below";
}
