import { KCAL_TO_W, fToC, cToF, wbgt, ral, rel, nioshScreen, heatIndexF, oshaFromHeatIndex, oshaFromWbgt } from "./heat-calc.js";

const $ = id => document.getElementById(id);
let standard = "niosh";

const num = id => { const v = $(id).value.trim(); return v === "" ? NaN : Number(v); };
const unitF = () => $("tempUnit").value === "F";
const toC = t => (unitF() ? fToC(t) : t);
const showT = c => (unitF() ? `${cToF(c).toFixed(1)} °F (${c.toFixed(1)} °C)` : `${c.toFixed(1)} °C (${cToF(c).toFixed(1)} °F)`);
const toW = m => ($("metUnit").value === "kcal" ? m * KCAL_TO_W : m);

const OSHA_TEXT = {
  below: {
    cls: "clear",
    head: "Below the initial heat trigger",
    items: ["The proposed rule's trigger requirements do not apply at this reading."],
  },
  initial: {
    cls: "flag",
    head: "At or above the initial heat trigger",
    items: [
      "Cool drinking water, at least 1 quart per employee per hour",
      "Break areas: shade or air conditioning outdoors; air-conditioned or ventilated indoors",
      "Indoor work areas: increased air movement, air conditioning or radiant heat shielding",
      "Check humidity when fans are used above 102 °F",
      "Acclimatization protocol for new and returning employees",
      "Paid rest breaks as needed",
      "Two-way communication with employees",
      "Cooling PPE, if provided, kept cool while in use",
    ],
  },
  high: {
    cls: "flag",
    head: "At or above the high heat trigger",
    items: [
      "Everything required at the initial heat trigger, plus:",
      "Paid rest break of at least 15 minutes every 2 hours",
      "Observation for heat illness signs (buddy system or supervisor); lone workers contacted at least every 2 hours",
      "Hazard alert to employees on drinking water, rest break rights and emergency procedures",
      "Warning signs at indoor work areas that regularly exceed 120 °F",
    ],
  },
};

function setStandard(s) {
  standard = s;
  document.querySelectorAll(".toggle button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.std === s)));
  $("nioshOnly").hidden = s !== "niosh";
  $("oshaOnly").hidden = s !== "osha";
  $("oshaNote").hidden = s !== "osha";
  layout();
}

function layout() {
  const useWbgt = standard === "niosh" || $("metric").value === "wbgt";
  $("wbgtBlock").hidden = !useWbgt;
  $("hiBlock").hidden = useWbgt;
  const workMin = num("workMin");
  $("restBlock").hidden = !(workMin > 0 && workMin < 60);
  $("hToRest").hidden = $("restBlock").hidden;
  $("hiFromReading").hidden = $("hiSource").value !== "reading";
  $("hiFromAir").hidden = $("hiSource").value !== "air";
  document.querySelectorAll(".tunit").forEach(e => { e.textContent = unitF() ? "°F" : "°C"; });
  document.querySelectorAll(".munit").forEach(e => { e.textContent = $("metUnit").value === "kcal" ? "kcal/h" : "W"; });
  $("result").hidden = true;
}

function fail(msg) {
  const r = $("result");
  r.hidden = false;
  r.innerHTML = `<p id="verdict" class="flag">${msg}</p>`;
}

function wbgtInputs() {
  const workMin = num("workMin");
  if (!(workMin > 0 && workMin <= 60)) return { err: "Enter minutes of work per hour between 1 and 60." };
  const wbgtWork = num("wbgtWork"), mWork = num("mWork");
  if (!isFinite(wbgtWork)) return { err: "Enter the WBGT at the work area." };
  if (!(mWork > 0)) return { err: "Enter the metabolic rate during work (greater than zero)." };
  let wbgtRest = 0, mRest = 0;
  if (workMin < 60) {
    wbgtRest = num("wbgtRest"); mRest = num("mRest");
    if (!isFinite(wbgtRest)) return { err: "Enter the WBGT at the rest area." };
    if (!(mRest > 0)) return { err: "Enter the metabolic rate during rest (greater than zero)." };
  }
  return { workMin, wbgtWork: toC(wbgtWork), wbgtRest: toC(wbgtRest), mWork: toW(mWork), mRest: toW(mRest) };
}

function twaLines(r, workMin) {
  const mKcal = r.twaM / KCAL_TO_W;
  return `<table class="res">
<tr><td>1-hour TWA WBGT</td><td>${showT(r.twaWbgt)}</td></tr>
<tr><td>1-hour TWA metabolic rate</td><td>${r.twaM.toFixed(0)} W (${mKcal.toFixed(0)} kcal/h)</td></tr>
<tr><td>NIOSH RAL (unacclimatized)</td><td>${showT(r.ral)}</td></tr>
<tr><td>NIOSH REL (acclimatized)</td><td>${showT(r.rel)}</td></tr>
${workMin < 60 ? `<tr><td>Work / rest each hour</td><td>${workMin} / ${60 - workMin} min</td></tr>` : ""}
</table>`;
}

function calculate() {
  const out = $("result");
  if (standard === "niosh" || $("metric").value === "wbgt") {
    const v = wbgtInputs();
    if (v.err) return fail(v.err);
    const acclimatized = $("acclim").value === "yes";
    const r = nioshScreen({ ...v, acclimatized });
    if (standard === "niosh") {
      const diff = r.twaWbgt - r.limit;
      const verdict = r.exceeds
        ? `Exceeds the NIOSH ${r.limitName} by ${Math.abs(diff).toFixed(1)} °C-WBGT`
        : `Does not exceed the NIOSH ${r.limitName} (${Math.abs(diff).toFixed(1)} °C-WBGT below it)`;
      out.innerHTML = `<p id="verdict" class="${r.exceeds ? "flag" : "clear"}">${verdict}</p>
${twaLines(r, v.workMin)}
<p class="src">The ${r.limitName} applies because the worker is ${acclimatized ? "acclimatized" : "not acclimatized"}. NIOSH 2016-106, Section 1.1.3: when the WBGT and screening metabolic rate exceed the applicable limit, the metabolic rate should be measured and work conditions modified.</p>`;
    } else {
      const level = oshaFromWbgt(r.twaWbgt, r.twaM);
      out.innerHTML = oshaBlock(level) + twaLines(r, v.workMin)
        + `<p class="src">Proposed rule: initial heat trigger is a WBGT equal to the NIOSH RAL; high heat trigger is a WBGT equal to the NIOSH REL. Acclimatization does not change the triggers.</p>`;
    }
  } else {
    let hi;
    if ($("hiSource").value === "reading") {
      hi = num("hiReading");
      if (!isFinite(hi)) return fail("Enter the heat index.");
      hi = unitF() ? hi : cToF(hi);
    } else {
      const t = num("airT"), rh = num("rh");
      if (!isFinite(t)) return fail("Enter the air temperature.");
      if (!(rh >= 0 && rh <= 100)) return fail("Enter relative humidity between 0 and 100%.");
      hi = heatIndexF(unitF() ? t : cToF(t), rh);
    }
    const level = oshaFromHeatIndex(hi);
    out.innerHTML = oshaBlock(level) + `<table class="res">
<tr><td>Heat index</td><td>${hi.toFixed(1)} °F (${fToC(hi).toFixed(1)} °C)</td></tr>
<tr><td>Initial heat trigger</td><td>80 °F heat index</td></tr>
<tr><td>High heat trigger</td><td>90 °F heat index</td></tr>
</table>
${$("hiSource").value === "air" ? `<p class="src">Heat index calculated with the National Weather Service equation (Rothfusz regression with NWS adjustments). NWS heat index values are for shade.</p>` : ""}`;
  }
  out.hidden = false;
}

function oshaBlock(level) {
  const t = OSHA_TEXT[level];
  return `<p id="verdict" class="${t.cls}">${t.head}</p>
<ul class="req">${t.items.map(i => `<li>${i}</li>`).join("")}</ul>`;
}

function helperCalc(target) {
  const nwb = num("hNwb"), g = num("hGlobe"), d = num("hDry");
  const sun = $("hSun").value === "sun";
  if (!isFinite(nwb) || !isFinite(g) || (sun && !isFinite(d))) {
    $("hOut").textContent = sun ? "Enter natural wet bulb, globe and dry bulb temperatures." : "Enter natural wet bulb and globe temperatures.";
    return;
  }
  const w = wbgt(nwb, g, d, sun); // linear, so it works in °F or °C alike
  $("hOut").textContent = `WBGT = ${w.toFixed(1)} ${unitF() ? "°F" : "°C"}`;
  if (target) { $(target).value = w.toFixed(1); $("result").hidden = true; }
}

function clearAll() {
  document.querySelectorAll("main input").forEach(i => { i.value = i.dataset.default || ""; });
  $("hOut").textContent = "";
  layout();
}

document.querySelectorAll(".toggle button").forEach(b => b.addEventListener("click", () => setStandard(b.dataset.std)));
["metric", "hiSource", "tempUnit", "metUnit", "hSun"].forEach(id => $(id).addEventListener("change", layout));
$("workMin").addEventListener("input", layout);
$("hSun").addEventListener("change", () => { $("hDryRow").hidden = $("hSun").value !== "sun"; });
$("calcBtn").addEventListener("click", calculate);
$("clearBtn").addEventListener("click", clearAll);
$("hToWork").addEventListener("click", () => helperCalc("wbgtWork"));
$("hToRest").addEventListener("click", () => helperCalc("wbgtRest"));
$("hCalc").addEventListener("click", () => helperCalc(null));
setStandard("niosh");
