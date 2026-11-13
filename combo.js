// Combined pages: one page with a picker for a group of related calculators (see combos.js).
// Each choice runs the same page code (app.js) and the same equations (calculators.js) as that
// calculator's own page, so a combined page can never give a different answer.
// Switching calculators keeps what is typed in any box that both calculators share
// (same symbol, same description and same units).
import { CALCULATORS } from "./calculators.js";
import { COMBOS } from "./combos.js";

const combo = COMBOS.find(c => c.slug === document.body.dataset.combo);
const head = document.getElementById("combo");
const root = document.getElementById("calc");
const members = combo.members.map(slug => CALCULATORS.find(c => c.slug === slug));
const same = (a, b) => a && b && a.label === b.label && a.unit === b.unit;
let shown = null;   // the calculator on screen
let run = 0;

head.innerHTML = `
  <a class="back" href="../">${combo.back}</a>
  <h1>${combo.name}</h1>
  <p class="how">${combo.intro}</p>
  <label class="combo-pick" for="member">
    <span>${combo.pick}</span>
    <select id="member">${members.map((m, i) => `<option value="${i}">${combo.labels?.[i] ?? m.name}</option>`).join("")}</select>
  </label>`;
const select = document.getElementById("member");

async function show() {
  const next = members[select.value];
  const kept = {};
  if (shown) for (const v of shown.vars) {
    const box = root.querySelector(`input[name="${v.k}"]`);
    if (box && box.value.trim() !== "" && same(v, next.vars.find(x => x.k === v.k))) kept[v.k] = box.value;
  }
  document.body.dataset.slug = next.slug;
  await import(`./app.js?run=${++run}`);   // a new address each time, so the page code runs again
  for (const [k, value] of Object.entries(kept)) {
    const box = root.querySelector(`input[name="${k}"]`);
    if (box) box.value = value;
  }
  document.title = `${combo.name} | ${combo.site}`;
  shown = next;
}

select.addEventListener("change", show);
show();
