import { CALCULATORS } from "./calculators.js";
import { solveBlank } from "./solver.js";
import { DIAGRAMS } from "./diagram.js";

const calc = CALCULATORS.find(c => c.slug === document.body.dataset.slug);
const root = document.getElementById("calc");

function fmt(x) {
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e7) return String(Number(x.toPrecision(4)));
  return x.toExponential(3);
}

const field = v => v.options
  ? `<select id="in-${v.k}" name="${v.k}">${v.options.map(([val, text]) => `<option value="${val}">${text}</option>`).join("")}</select>`
  : `<input id="in-${v.k}" name="${v.k}" type="text" inputmode="decimal" autocomplete="off">`;

const row = v => `
        <label class="row" for="in-${v.k}">
          <span class="name">${v.label}</span>
          ${field(v)}
          <span class="unit">${v.unit}</span>
        </label>`;

// Reads a number box. Returns undefined when blank, or throws on text that is not a number.
function readNumber(input) {
  const raw = input.value.trim().replace(/,/g, "");
  if (raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`"${raw}" is not a number.`);
  return n;
}

function render() {
  document.title = `${calc.name} | OEMS Safety Calculators`;
  const check = calc.check;
  root.innerHTML = `
    <a class="back" href="../">All safety calculators</a>
    <h1>${calc.name}</h1>
    <p class="${calc.rule ? "rule" : "eq"}">${calc.equation}</p>
    ${calc.note ? `<p class="note">${calc.note}</p>` : ""}
    <p class="how">${calc.rule
      ? "Fill in every box and press Check."
      : "Fill in every box except the one you want. Leave that one blank and press Solve."}</p>
    <form id="f" novalidate>
      ${calc.vars.map(row).join("")}
      ${check ? `<h2 class="check-head">Threshold check</h2>${row({ k: "check", ...check })}` : ""}
      <div class="buttons">
        <button type="submit">${calc.rule ? "Check" : "Solve"}</button>
        <button type="button" id="clear" class="secondary">Clear</button>
      </div>
      <p id="msg" role="status" aria-live="polite"></p>
      <p id="verdict" hidden></p>
    </form>
    ${DIAGRAMS[calc.slug] ? `<div id="diagram" class="diagram" hidden></div>` : ""}
    <p class="src">Source: ${calc.source}</p>`;

  const form = document.getElementById("f");
  const msg = document.getElementById("msg");
  const verdict = document.getElementById("verdict");
  const showVerdict = (flag, text) => { verdict.className = flag ? "flag" : "clear"; verdict.textContent = text; verdict.hidden = false; };
  const diagram = document.getElementById("diagram");
  const drawDiagram = all => {
    if (!diagram) return;
    const svg = DIAGRAMS[calc.slug](all, root.clientWidth - 26);
    diagram.innerHTML = svg || "";
    diagram.hidden = !svg;
  };
  const reset = () => {
    form.querySelectorAll("input").forEach(i => i.classList.remove("solved"));
    msg.textContent = ""; msg.className = "";
    verdict.hidden = true;
    if (diagram) { diagram.hidden = true; diagram.innerHTML = ""; }
  };
  if (check && check.default !== undefined) form.elements.check.value = check.default;

  form.addEventListener("submit", e => {
    e.preventDefault();
    reset();
    try {
      const values = {};
      for (const v of calc.vars) {
        const val = v.options ? form.elements[v.k].value : readNumber(form.elements[v.k]);
        if (val !== undefined) values[v.k] = val;
      }

      if (calc.rule) {
        const missing = calc.vars.filter(v => !v.optional && values[v.k] === undefined);
        if (missing.length) throw new Error(`Fill in every box. ${missing.length} ${missing.length === 1 ? "box is" : "boxes are"} blank.`);
        const d = calc.decide(values);
        msg.className = "ok";
        msg.textContent = `Result: ${d.result}`;
        showVerdict(d.flag, d.text);
        drawDiagram(values);
        return;
      }

      const { key, value } = solveBlank(calc, values);
      const input = form.elements[key];
      input.value = fmt(value);
      input.classList.add("solved");
      const v = calc.vars.find(x => x.k === key);
      msg.className = "ok";
      msg.textContent = `${v.label.split(",")[0]} = ${fmt(value)} ${v.unit}`;

      const all = { ...values, [key]: value };
      if (check) {
        const t = check.options ? Number(form.elements.check.value) : readNumber(form.elements.check);
        if (t !== undefined) {
          all.check = t;
          const yes = check.test(all[calc.primary], t);
          showVerdict(yes === check.flagIfYes, yes ? check.yes : check.no);
        }
      }
      const warning = calc.warn && calc.warn(all);
      if (warning) showVerdict(warning.flag, warning.text);
      drawDiagram(all);
    } catch (err) {
      msg.className = "err";
      msg.textContent = err.message;
    }
  });

  document.getElementById("clear").addEventListener("click", () => {
    form.reset();
    if (check && check.default !== undefined) form.elements.check.value = check.default;
    reset();
  });
}

if (calc) render();
else root.textContent = "Calculator not found.";
