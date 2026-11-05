// Screens for the Recordability Determination Tool.
// Answers live only in the variable A below. Nothing is written to cookies, localStorage, sessionStorage,
// IndexedDB or the network. Closing or refreshing the page erases everything.
import { QUESTIONS, SECTIONS, byId, visible, prune, step, FIRST_AID, PRIVACY_LIST } from "./flow.js";
import { evaluate, special, REPORT_EVENTS, U, fmtDT } from "./engine.js";
import { RULES, RULES_REVIEWED, NAICS_EXEMPT, NAICS_CHECKED, GLOSSARY, FORM_301 } from "./rules.js";
import { SHORT_DISCLAIMER, FULL_DISCLAIMER } from "./disclaimer-text.js";

let A = {};
let screen = "start"; // "start" | question id | "results"
const app = document.getElementById("app");

// A page restored from the browser's back/forward cache would bring old answers back; start fresh instead.
window.addEventListener("pageshow", e => { if (e.persisted) location.reload(); });

const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "text") el.textContent = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
};
let uid = 0;
const nid = p => `${p}-${++uid}`;
const cite = id => RULES[id] ? `${RULES[id].cite}${RULES[id].source === "Interpretation" && !/OSHA/.test(RULES[id].cite) ? " (OSHA interpretation)" : ""}` : id;

// ---------- Dialogs (glossary, full disclaimer) ----------
function dialog(title, body) {
  const d = h("dialog", { class: "rt-dialog", "aria-labelledby": "dlgTitle" },
    h("div", { class: "rt-dialog-head" }, h("h2", { id: "dlgTitle", text: title }), h("button", { type: "button", class: "secondary", onclick: () => d.close(), text: "Close" })),
    body);
  d.addEventListener("close", () => d.remove());
  document.body.append(d);
  d.showModal();
}
const showDisclaimer = () => dialog("Disclaimer", h("div", { class: "rt-full" }, FULL_DISCLAIMER.map(([t, p]) => h("p", {}, t ? h("strong", { text: t + " " }) : null, p))));
const showGlossary = () => dialog("Glossary", h("dl", { class: "rt-gloss" }, GLOSSARY.map(([t, d]) => [h("dt", { text: t }), h("dd", { text: d })])));

// ---------- Frame ----------
function frame(section, ...content) {
  const idx = SECTIONS.indexOf(section);
  const progress = section ? h("ol", { class: "rt-progress", "aria-label": "Progress" },
    SECTIONS.map((s, i) => h("li", { class: i < idx ? "done" : i === idx ? "now" : "", "aria-current": i === idx ? "step" : null, text: s }))) : null;
  const rpt = urgentNow();
  return [
    h("div", { class: "rt-top" },
      h("h1", { text: "Recordability Determination Tool" }),
      h("div", { class: "rt-links" },
        h("button", { type: "button", class: "linklike", onclick: showGlossary, text: "Glossary" }),
        h("button", { type: "button", class: "linklike", onclick: showDisclaimer, text: "Full disclaimer" }))),
    progress,
    rpt && screen !== "results" ? h("div", { class: "rt-urgent", role: "alert" }, h("strong", { text: "This may need to be reported to OSHA now. " }), "A work-related death must be reported within 8 hours; an in-patient hospitalization, amputation or loss of an eye within 24 hours. Call 1-800-321-OSHA (6742) or use osha.gov/report. Do not wait for this tool.") : null,
    ...content,
  ];
}
const urgentNow = () => REPORT_EVENTS.some(e => e.ans(A) === "yes") && A.rp_exception !== "yes";

function render(focusHeading = true) {
  app.replaceChildren(...(screen === "start" ? startScreen() : screen === "results" ? resultsScreen() : questionScreen(byId[screen])).filter(Boolean));
  if (focusHeading) { const t = app.querySelector("[data-focus]"); if (t) t.focus({ preventScroll: false }); window.scrollTo(0, 0); }
}

// ---------- Start ----------
function startScreen() {
  return frame(null,
    h("p", { class: "how", text: "Answer one question at a time to find out whether a work injury or illness is OSHA recordable, what goes on the OSHA 300 log, and whether it must be reported to OSHA. The tool predicts; the employer makes the final recording decision." }),
    h("section", { class: "rt-card", "aria-labelledby": "startTitle" },
      h("h2", { id: "startTitle", tabindex: "-1", "data-focus": true, text: "Before you start" }),
      h("p", { text: SHORT_DISCLAIMER }),
      h("p", {}, h("button", { type: "button", class: "linklike", onclick: showDisclaimer, text: "Read the full disclaimer" })),
      h("p", { class: "src", text: "Nothing you enter is saved or sent anywhere. Closing or refreshing this page erases your answers. Do not enter names or other identifying information; the tool never asks for them." }),
      h("div", { class: "buttons" }, h("button", { type: "button", onclick: () => { screen = QUESTIONS[0].id; render(); }, text: "I understand" }))));
}

// ---------- Question screens ----------
function questionScreen(q) {
  const err = h("p", { class: "rt-err", id: nid("err"), role: "alert" });
  const { input, read } = inputFor(q, err);
  const vis = visible(A);
  const n = vis.findIndex(x => x.id === q.id) + 1;
  const heading = h("h2", { id: nid("q"), tabindex: "-1", "data-focus": true, text: q.text });
  const go = dir => {
    if (dir > 0) {
      const v = read();
      if (v === undefined) return;
      A[q.id] = v; prune(A);
    } else { const v = read(true); if (v !== undefined) { A[q.id] = v; prune(A); } }
    const nextId = step(A, q.id, dir);
    screen = nextId || (dir > 0 ? "results" : "start");
    render();
  };
  return frame(q.section,
    h("form", { class: "rt-card", novalidate: true, autocomplete: "off", onsubmit: e => { e.preventDefault(); go(1); }, oninput: () => { err.textContent = ""; }, onchange: () => { err.textContent = ""; } },
      h("p", { class: "rt-step", text: `${q.section} · question ${n}` }),
      heading,
      q.note ? h("p", { class: "rt-note", text: q.note }) : null,
      input,
      q.firstAid ? listBox("OSHA's complete first aid list (1904.7(b)(5)(ii))", FIRST_AID) : null,
      q.privacyList ? listBox("Privacy cases (1904.29(b)(7))", PRIVACY_LIST) : null,
      err,
      h("details", { class: "rt-why" }, h("summary", { text: "Why we ask" }),
        h("ul", {}, q.why.map(id => h("li", {}, h("strong", { text: cite(id) + ": " }), RULES[id].text)))),
      h("div", { class: "buttons" },
        h("button", { type: "button", class: "secondary", onclick: () => go(-1), text: "Back" }),
        h("button", { type: "submit", text: "Next" }))));
}

const listBox = (title, items) => h("div", { class: "rt-list" }, h("p", { class: "rt-list-title", text: title }), h("ul", {}, items.map(t => h("li", { text: t }))));

function radios(name, options, current, legend) {
  const fs = h("fieldset", { class: "rt-radios" }, h("legend", { class: "sr-only", text: legend }));
  for (const [val, label] of options) {
    const id = nid("r");
    fs.append(h("label", { for: id, class: "rt-opt" }, h("input", { type: "radio", name, id, value: val, checked: current === val }), h("span", { text: label })));
  }
  return fs;
}
const radioValue = (root, name) => { const c = root.querySelector(`input[name="${name}"]:checked`); return c ? c.value : undefined; };
const unsureBox = (checked, label = "Not sure") => {
  const id = nid("u");
  return h("label", { for: id, class: "rt-opt rt-unsure" }, h("input", { type: "checkbox", id, checked: checked }), h("span", { text: label }));
};
const field = (label, input, hint) => {
  const id = input.id || (input.id = nid("f"));
  return h("div", { class: "rt-field" }, h("label", { for: id, text: label }), input, hint ? h("span", { class: "src", text: hint }) : null);
};
const dateIn = (v, type = "date") => h("input", { type, value: v || "", autocomplete: "off" });

function inputFor(q, err) {
  const cur = A[q.id];
  const fail = msg => { err.textContent = msg; return undefined; };
  const name = nid("n");
  if (q.type === "ynu" || q.type === "choice") {
    const opts = q.type === "ynu" ? [["yes", "Yes"], ["no", "No"], [U, "Not sure"]] : [...q.options, [U, "Not sure"]];
    const box = radios(name, opts, cur, q.text);
    return { input: box, read: soft => radioValue(box, name) ?? (soft ? undefined : fail("Choose an answer, or choose Not sure.")) };
  }
  if (q.type === "state") {
    const sel = h("select", { id: nid("s") }, h("option", { value: "", text: "Choose a state or territory" }), q.options.map(p => h("option", { value: p, selected: cur === p, text: p })), h("option", { value: U, selected: cur === U, text: "Not sure" }));
    return { input: field("State or territory", sel), read: soft => sel.value || (soft ? undefined : fail("Choose a state or territory, or Not sure.")) };
  }
  if (q.type === "naics") {
    const inp = h("input", { type: "text", inputmode: "numeric", maxlength: "6", autocomplete: "off", value: cur && cur !== U ? cur : "" });
    const out = h("div", { "aria-live": "polite" });
    const un = unsureBox(cur === U, "Not sure of the NAICS code");
    const osha = () => h("a", { href: "https://www.osha.gov/laws-regs/regulations/standardnumber/1904/1904SubpartBAppA", target: "_blank", rel: "noopener noreferrer", text: "OSHA's list" });
    // Plain-language result for the code entered, with what it means for this employer.
    const show = () => {
      const c = inp.value.replace(/\D/g, "").slice(0, 4);
      if (un.querySelector("input").checked || c.length < 4) { out.replaceChildren(); return; }
      const sizeLine = A.emp_small === "no" ? "You answered that the company had more than 10 employees last year, so the size exemption does not apply either."
        : "That is, unless the whole company had 10 or fewer employees at all times last year.";
      out.replaceChildren(NAICS_EXEMPT[c]
        ? h("div", { class: "rt-answer clear" },
            h("p", { class: "rt-answer-head", text: "Result: partially exempt by industry" }),
            h("p", { text: `${c} (${NAICS_EXEMPT[c]}) is on OSHA's list of partially exempt industries (Appendix A to Subpart B).` }),
            h("p", {}, h("strong", { text: "What this means: " }), "this establishment does not have to keep the routine OSHA 300 log and 301 forms, unless OSHA or the Bureau of Labor Statistics asks in writing (the next question). It must still report a work-related death, in-patient hospitalization, amputation or loss of an eye to OSHA. The tool will still tell you whether the case meets the recording criteria."))
        : h("div", { class: "rt-answer flag" },
            h("p", { class: "rt-answer-head", text: "Result: not exempt by industry" }),
            h("p", { text: `${c} is not on OSHA's list of partially exempt industries (Appendix A to Subpart B). Most industries are not on it.` }),
            h("p", {}, h("strong", { text: "What this means: " }), `this establishment must keep the OSHA 300 log, the 301 forms and the 300A annual summary. ${sizeLine}`),
            h("p", { class: "src" }, "OSHA's list uses 2007 NAICS codes. If your industry's code has changed since then (restaurants are one example: 722511 today, 7221 on the list), check ", osha(), " for your industry, or choose Not sure.")));
    };
    inp.addEventListener("input", show); un.querySelector("input").addEventListener("change", show); show();
    return {
      input: h("div", {}, field("NAICS code (4 to 6 digits)", inp, `Appendix A list last checked ${NAICS_CHECKED}.`), out, un),
      read: soft => {
        if (un.querySelector("input").checked) return U;
        const c = inp.value.replace(/\D/g, "");
        if (c.length >= 4) return c;
        return soft ? undefined : fail("Enter at least the first 4 digits of the NAICS code, or check Not sure.");
      },
    };
  }
  if (q.type === "incident") {
    const d = dateIn(cur && cur !== U ? cur.date : ""), t = dateIn(cur && cur !== U ? cur.time : "", "time");
    const un = unsureBox(cur === U, "Not sure of the date");
    return {
      input: h("div", {}, field("Date of the injury or onset of illness", d), field("Time of the incident (if known)", t, "Needed for the report-to-OSHA windows. Leave blank if unknown; the tool will not guess it."), un),
      read: soft => un.querySelector("input").checked ? U : d.value ? { date: d.value, time: t.value } : (soft ? undefined : fail("Enter the date, or check Not sure.")),
    };
  }
  if (q.type === "levels") {
    const v = cur && cur !== U ? cur : { L: {}, R: {} };
    const cell = (ear, k) => h("input", { type: "number", inputmode: "decimal", step: "any", "aria-label": `${ear === "L" ? "Left" : "Right"} ear, ${k[0] === "b" ? "baseline" : "current"}, ${k[1]}000 Hz`, value: v[ear]?.[k] ?? "", "data-ear": ear, "data-k": k });
    const table = h("table", { class: "rt-levels" },
      h("thead", {}, h("tr", {}, h("th", { scope: "col", text: "" }), ...["2000 Hz", "3000 Hz", "4000 Hz"].map(t => h("th", { scope: "col", text: t })))),
      h("tbody", {}, ["L", "R"].flatMap(ear => ["b", "c"].map(bc => h("tr", {}, h("th", { scope: "row", text: `${ear === "L" ? "Left" : "Right"} ${bc === "b" ? "baseline" : "current"}` }), ...["2", "3", "4"].map(f => h("td", {}, cell(ear, bc + f))))))));
    const un = unsureBox(cur === U, "I don't have these numbers");
    return {
      input: h("div", {}, h("div", { class: "rt-scroll" }, table), h("p", { class: "src", text: "Missing numbers make the result Needs review." }), un),
      read: () => {
        if (un.querySelector("input").checked) return U;
        const out = { L: {}, R: {} };
        for (const i of table.querySelectorAll("input")) out[i.dataset.ear][i.dataset.k] = i.value;
        return out;
      },
    };
  }
  if (q.type === "agedata") {
    const v = cur && cur !== U ? cur : {};
    const sex = radios(name, [["male", "Male (Table F-1)"], ["female", "Female (Table F-2)"]], v.sex, "Sex");
    const ab = h("input", { type: "number", min: "0", max: "120", value: v.ageBase ?? "" }), ac = h("input", { type: "number", min: "0", max: "120", value: v.ageCur ?? "" });
    const un = unsureBox(cur === U);
    return {
      input: h("div", {}, sex, field("Age at the baseline audiogram", ab), field("Age at the current audiogram", ac), un),
      read: soft => un.querySelector("input").checked ? U : (radioValue(sex, name) && ab.value && ac.value) ? { sex: radioValue(sex, name), ageBase: ab.value, ageCur: ac.value } : (soft ? undefined : fail("Enter sex and both ages, or check Not sure.")),
    };
  }
  if (q.type === "retest") {
    const v = cur && cur !== U ? cur : {};
    const f = dateIn(v.first), r = dateIn(v.retest);
    const conf = radios(name, [["yes", "The retest confirmed the shift"], ["no", "The retest did not confirm the shift"]], v.confirmed, "Retest result");
    const un = unsureBox(cur === U);
    return {
      input: h("div", {}, field("Date of the first audiogram that showed the shift", f), field("Date of the retest", r), conf, un),
      read: soft => un.querySelector("input").checked ? U : (f.value && r.value && radioValue(conf, name)) ? { first: f.value, retest: r.value, confirmed: radioValue(conf, name) } : (soft ? undefined : fail("Enter both dates and the result, or check Not sure.")),
    };
  }
  if (q.type === "days") return daysInput(cur, fail);
  if (q.type === "times") {
    const v = cur && cur !== U ? cur : {};
    const e = dateIn(v.event, "datetime-local"), l = dateIn(v.learned, "datetime-local"), w = dateIn(v.learnedWR, "datetime-local");
    return {
      input: h("div", {},
        field(`Date and time of the ${q.event}`, e),
        field(`When you or your agent learned of the ${q.event}`, l),
        field("When you learned it was work-related", w),
        h("p", { class: "src", text: "Leave a box blank if you don't know. The tool never guesses a missing date or time; it will tell you what is missing. The clock starts at whichever of these came last." })),
      read: () => ({ event: e.value, learned: l.value, learnedWR: w.value }),
    };
  }
  throw new Error("Unknown question type " + q.type);
}

function daysInput(cur, fail) {
  const v = cur && cur !== U ? structuredClone(cur) : { periods: [{ kind: "away", source: "provider", start: "", end: "" }], asOf: new Date().toISOString().slice(0, 10) };
  const list = h("div", { class: "rt-periods" });
  const row = p => {
    const kind = h("select", { "aria-label": "Type" }, h("option", { value: "away", selected: p.kind === "away", text: "Days away" }), h("option", { value: "restricted", selected: p.kind === "restricted", text: "Restricted or transferred" }));
    const src = h("select", { "aria-label": "Source" }, h("option", { value: "provider", selected: p.source === "provider", text: "Provider recommended" }), h("option", { value: "actual", selected: p.source === "actual", text: "Employee actually did, or employer imposed" }));
    const s = dateIn(p.start), e = dateIn(p.end);
    const r = h("div", { class: "rt-period" },
      field("Type", kind), field("Source", src), field("First day", s), field("Last day (blank if still going)", e),
      h("button", { type: "button", class: "secondary remove", onclick: () => r.remove(), text: "Remove" }));
    r.read = () => ({ kind: kind.value, source: src.value, start: s.value, end: e.value });
    return r;
  };
  for (const p of v.periods) list.append(row(p));
  const opt = (label, key, hint) => { const i = dateIn(v[key]); i.dataset.key = key; return field(label, i, hint); };
  const extras = h("div", {},
    opt("Provider released to work with restrictions (ends the days-away count)", "rtwAway"),
    opt("Provider released to full duty (ends all counting)", "rtwFull"),
    opt("Job permanently modified", "permMod", "Restricted days stop counting; at least one restricted day still counts."),
    opt("Employee left for a reason unrelated to the case (retired, quit, laid off)", "separation", "Counting may stop on this date."),
    opt("Count open periods through", "asOf", "Used only for periods that are still going."));
  const un = unsureBox(cur === U, "I don't have these dates yet");
  return {
    input: h("div", {}, list, h("button", { type: "button", class: "secondary", onclick: () => list.append(row({ kind: "restricted", source: "actual", start: "", end: "" })), text: "Add a period" }), extras, un),
    read: soft => {
      if (un.querySelector("input").checked) return U;
      const periods = [...list.children].map(r => r.read()).filter(p => p.start || p.end);
      if (!soft && periods.some(p => !p.start)) return fail("Each period needs a first day.");
      if (!soft && periods.some(p => p.end && p.end < p.start)) return fail("A period ends before it starts.");
      if (!soft && !periods.length) return fail("Enter at least one period, or check I don't have these dates yet.");
      const out = { periods };
      for (const i of extras.querySelectorAll("input")) out[i.dataset.key] = i.value;
      return out;
    },
  };
}

// ---------- Results ----------
const STATUS_CLASS = { recordable: "flag", review: "review", not: "clear", required: "flag", exempt: "clear", other: "review", report: "urgent", na: "clear" };

function reasonList(items) {
  if (!items.length) return null;
  return h("ul", { class: "rt-reasons" }, items.map(r => h("li", {}, r.text, " ", h("span", { class: "rt-cite", text: `(${cite(r.rule)})` }))));
}

function unknowns() {
  const list = [];
  for (const q of visible(A)) if (A[q.id] === U) list.push(q.text);
  for (const q of visible(A)) if (!(q.id in A)) list.push(`Not answered: ${q.text}`);
  return list;
}

function resultsScreen() {
  const res = evaluate(A);
  const { rec, log, rpt, state, entry, actions } = res;
  const unk = unknowns();
  const sp = special(A);
  const out = [];
  out.push(h("h2", { tabindex: "-1", "data-focus": true, text: "Results" }));
  out.push(h("p", { class: "rt-meta" }, h("strong", { text: "Federal OSHA baseline. " }), `Facts as of ${fmtDT(res.factsAsOf)}. Rules last reviewed ${RULES_REVIEWED}.`));
  if (state.level !== "federal") out.push(h("div", { class: "rt-warn", role: "note" }, h("strong", { text: "State plan. " }), state.text));
  if (rpt.urgent || rpt.status === "report") out.push(h("div", { class: "rt-urgent", role: "alert" }, h("strong", { text: rpt.status === "report" ? "Report this to OSHA. " : "This may need to be reported to OSHA. " }), rpt.events.filter(e => e.status !== "not").map(e => `${e.label}: within ${e.hours} hours${e.deadline ? `, by ${fmtDT(e.deadline)}` : ""}. `).join(""), "Call 1-800-321-OSHA (6742), call or visit the nearest OSHA Area Office, or use the online form on osha.gov. Voicemail, fax and email do not count."));

  const card = (title, status, label, reasons, extra) => h("section", { class: "rt-card rt-result" }, h("h3", { text: title }), h("p", { class: `rt-status ${STATUS_CLASS[status] || ""}`, text: label }), reasonList(reasons), extra);
  out.push(card("1. Does the case meet OSHA's recording criteria?", rec.status, rec.label, [...rec.reasons, ...rec.notes],
    rec.review.length ? h("div", {}, h("p", { class: "rt-sub", text: "Needs review because:" }), reasonList(rec.review),
      h("p", { class: "src" }, "See OSHA's ", h("a", { href: "https://www.osha.gov/laws-regs/standardinterpretations", target: "_blank", rel: "noopener noreferrer", text: "interpretation letters" }), " and ", h("a", { href: "https://www.osha.gov/recordkeeping", target: "_blank", rel: "noopener noreferrer", text: "recordkeeping FAQs" }), ".")) : null));
  out.push(card("2. Must this employer keep the OSHA 300 log?", log.status, log.label, log.reasons));
  out.push(card("3. Must it be reported to OSHA right away?", rpt.status, rpt.label, rpt.reasons));

  if (unk.length) out.push(h("section", { class: "rt-card" }, h("h3", { text: "Facts still unknown" }), h("ul", {}, unk.map(t => h("li", { text: t })))));

  if (entry) {
    const exemptNote = log.status === "exempt" ? "This employer is exempt from keeping the log; shown for reference only." : log.status === "other" ? "Share this with the employer that supervises the worker; it goes on that employer's log." : null;
    const rows = [
      ["(A) Case no.", entry.A], ["(B) Employee's name", entry.B], ["(C) Job title", entry.C], ["(D) Date of injury or onset", entry.D],
      ["(E) Where the event occurred", entry.E], ["(F) Description", entry.F], ["(G) to (J) Outcome (check one)", entry.outcome],
      ["(K) Days away", String(entry.K)], ["(L) Days restricted or transferred", String(entry.L)], ["(M) Injury or illness type", entry.M],
    ];
    out.push(h("section", { class: "rt-card" }, h("h3", { text: "OSHA 300 log entry" }), exemptNote ? h("p", { class: "rt-note", text: exemptNote }) : null,
      h("table", { class: "rt-table" }, h("tbody", {}, rows.map(([k, v]) => h("tr", {}, h("th", { scope: "row", text: k }), h("td", { text: v }))))),
      h("p", { class: "src", text: `${cite("LOG-OUTCOME")}: exactly one outcome box, the most serious. If the case later becomes more serious, change the box.` }),
      entry.privacy ? h("p", { class: "rt-note", text: `Privacy case (${cite("LOG-PRIVACY")}). The separate confidential list of names must still be given to the government if it asks; a privacy case keeps the name off the log that employees can see, not away from OSHA.` }) : null,
      entry.days ? daysDetail(entry.days) : null));
  }
  if (sp.type === "hearing" && sp.hearing) out.push(hearingDetail(sp.hearing));
  if (entry) out.push(h("section", { class: "rt-card" }, h("h3", { text: "OSHA 301 reminder" }), h("p", { text: "Complete the OSHA Form 301 (or an equivalent form) with:" }), h("ul", {}, FORM_301.map(t => h("li", { text: t })))));
  if (actions.length) out.push(h("section", { class: "rt-card" }, h("h3", { text: "Required actions and deadlines" }), reasonList(actions)));

  const msg = h("p", { class: "rt-live", "aria-live": "polite" });
  const copy = async (text, what) => {
    try { await navigator.clipboard.writeText(text); msg.textContent = `${what} copied.`; }
    catch { const ta = h("textarea", { class: "sr-only" }); ta.value = text; document.body.append(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); msg.textContent = ok ? `${what} copied.` : "Copy failed. Select the text and copy it yourself."; }
  };
  out.push(h("div", { class: "buttons rt-actions no-print" },
    h("button", { type: "button", onclick: () => copy(summaryText(res), "Summary"), text: "Copy summary" }),
    h("button", { type: "button", onclick: () => copy(fullText(res), "Full determination"), text: "Copy full determination" }),
    h("button", { type: "button", onclick: () => window.print(), text: "Print summary" })));
  out.push(h("p", { class: "src no-print", text: "A copy or printout leaves this tool and is yours to protect. The tool never asks for names or free-text descriptions, so nothing identifying is in it." }));
  out.push(msg);
  out.push(h("div", { class: "buttons no-print" },
    h("button", { type: "button", class: "secondary", onclick: () => { const vis = visible(A); screen = vis.at(-1).id; render(); }, text: "Back to the questions" }),
    h("button", { type: "button", class: "secondary", onclick: () => { A = {}; screen = "start"; render(); }, text: "Start over" })));
  out.push(h("p", { class: "disclaimer", text: SHORT_DISCLAIMER }));
  return frame("Results", ...out);
}

function daysDetail(d) {
  if (d.error) return h("p", { class: "rt-note", text: `Day counts: ${d.error} Count the days yourself or enter the dates.` });
  return h("div", {}, h("p", { class: "rt-sub", text: "How the days were counted" }),
    h("ul", {}, d.ranges.map(r => h("li", { text: `${r.kind === "away" ? "Days away" : "Restricted"}: ${r.start} to ${r.end}` }))),
    reasonList(d.notes),
    h("p", { class: "src", text: `${cite("LOG-DAYS")}. Calendar days starting the day after the injury, including weekends and holidays; no day is counted twice.` }));
}

function hearingDetail(hr) {
  const ear = (k, e) => {
    if (!e) return h("li", { text: `${k}: numbers missing.` });
    const f = n => (Math.round(n * 10) / 10).toString();
    return h("li", {},
      `${k} ear: baseline ${e.base.join(", ")} dB (average ${f(e.baseAvg)}); current ${e.cur.join(", ")} dB (average ${f(e.curAvg)}). `,
      `Unadjusted change ${f(e.change)} dB. `,
      e.adjusted !== null ? `Age correction ${f(e.ageAdj)} dB (Appendix F values at baseline ${e.ageCorr.base.join("/")}, current ${e.ageCorr.cur.join("/")}), age-adjusted change ${f(e.adjusted)} dB. ` : "",
      `Standard threshold shift: ${e.sts ? "yes" : "no"}. Unadjusted current average for the 25 dB test: ${f(e.curAvg)} dB (${e.over25 ? "25 dB or more" : "under 25 dB"}).`);
  };
  return h("section", { class: "rt-card" }, h("h3", { text: "Hearing loss math" }),
    h("ul", {}, ear("Left", hr.ears.L), ear("Right", hr.ears.R)),
    h("p", { class: "src", text: `${cite("SP-HEARING")}; ${cite("SP-HEARING-AGE")}.` }));
}

// ---------- Copy text ----------
const lines = rs => rs.map(r => `  - ${r.text} (${cite(r.rule)})`).join("\n");
function summaryText(res) {
  const { rec, log, rpt, state, entry } = res;
  const out = [
    "OEMS Recordability Determination Tool: summary",
    `Federal OSHA baseline. Facts as of ${fmtDT(res.factsAsOf)}. Rules last reviewed ${RULES_REVIEWED}.`,
    state.level !== "federal" ? `State: ${state.text}` : `State: ${state.text}`,
    "",
    `Recording criteria: ${rec.label}`,
    `OSHA 300 log: ${log.label}`,
    `Report to OSHA: ${rpt.label}`,
  ];
  for (const e of rpt.events.filter(e => e.status !== "not")) out.push(`  ${e.label}: within ${e.hours} hours${e.deadline ? `, deadline ${fmtDT(e.deadline)}` : " (deadline not computed: missing dates)"}`);
  if (entry) out.push("", `300 log: ${entry.outcome}; days away ${entry.K}; days restricted ${entry.L}; type ${entry.M}; name column: ${entry.B}`);
  const unk = unknowns();
  if (unk.length) out.push("", "Facts still unknown:", ...unk.map(t => `  - ${t}`));
  out.push("", SHORT_DISCLAIMER);
  return out.join("\n");
}
function fullText(res) {
  const { rec, log, rpt, state, entry, actions } = res;
  const out = [
    "OEMS Recordability Determination Tool: full determination",
    `Federal OSHA baseline. Facts as of ${fmtDT(res.factsAsOf)}. Rules last reviewed ${RULES_REVIEWED}.`,
    `State: ${state.text}`, "",
    "ANSWERS",
    ...visible(A).map(q => `- ${q.text}\n    ${q.id in A ? answerLabel(q, A[q.id]) : "Not answered"}`), "",
    `1. RECORDING CRITERIA: ${rec.label}`, lines([...rec.reasons, ...rec.notes]),
    rec.review.length ? "  Needs review because:\n" + lines(rec.review) : "", "",
    `2. OSHA 300 LOG: ${log.label}`, lines(log.reasons), "",
    `3. REPORT TO OSHA: ${rpt.label}`, lines(rpt.reasons), "",
  ];
  if (entry) {
    out.push("OSHA 300 LOG ENTRY", `  (A) ${entry.A}`, `  (B) ${entry.B}`, `  (C) ${entry.C}`, `  (D) ${entry.D}`, `  (E) ${entry.E}`, `  (F) ${entry.F}`, `  (G)-(J) ${entry.outcome}`, `  (K) Days away: ${entry.K}`, `  (L) Days restricted: ${entry.L}`, `  (M) ${entry.M}`);
    if (entry.days && !entry.days.error) out.push("  Day ranges:", ...entry.days.ranges.map(r => `    ${r.kind === "away" ? "Away" : "Restricted"} ${r.start} to ${r.end}`), lines(entry.days.notes));
    out.push("", "OSHA 301 CHECKLIST", ...FORM_301.map(t => `  - ${t}`), "");
  }
  if (actions.length) out.push("REQUIRED ACTIONS AND DEADLINES", lines(actions), "");
  out.push(SHORT_DISCLAIMER);
  return out.filter(x => x !== undefined).join("\n");
}
function answerLabel(q, v) {
  if (v === U) return "Not sure";
  if (q.type === "ynu") return v === "yes" ? "Yes" : "No";
  if (q.type === "choice") return (q.options.find(o => o[0] === v) || [, v])[1];
  if (q.type === "state" || q.type === "naics") return v;
  if (q.type === "incident") return `${v.date}${v.time ? " " + v.time : " (time not given)"}`;
  if (q.type === "times") return `event ${v.event || "?"}; learned ${v.learned || "?"}; learned work-related ${v.learnedWR || "?"}`;
  if (q.type === "levels") return ["L", "R"].map(e => `${e === "L" ? "Left" : "Right"}: baseline ${["b2", "b3", "b4"].map(k => v[e][k] || "?").join("/")}, current ${["c2", "c3", "c4"].map(k => v[e][k] || "?").join("/")}`).join("; ");
  if (q.type === "agedata") return `${v.sex}, age ${v.ageBase} at baseline, ${v.ageCur} now`;
  if (q.type === "retest") return `first ${v.first}, retest ${v.retest}, ${v.confirmed === "yes" ? "confirmed" : "not confirmed"}`;
  if (q.type === "days") return v.periods.map(p => `${p.kind} (${p.source}) ${p.start} to ${p.end || "open"}`).join("; ") + ["rtwAway", "rtwFull", "permMod", "separation"].filter(k => v[k]).map(k => `; ${k} ${v[k]}`).join("");
  return String(v);
}

render(false);
