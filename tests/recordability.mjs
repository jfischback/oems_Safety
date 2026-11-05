// Run with: node tests/recordability.mjs
// Test incidents with known answers for the Recordability Determination Tool.
// Each test lists the facts entered, the expected results, and the rule IDs it checks.
// The run fails if any test fails, or if any rule in rules.js is not checked by at least one test.
// A qualified OSHA recordkeeping professional must review this test set before public release.
import { RULES, NAICS_EXEMPT } from "../recordability-tool/rules.js";
import { evaluate, countDays, U } from "../recordability-tool/engine.js";
import { prune, visible, step, QUESTIONS } from "../recordability-tool/flow.js";

// A plain, covered, non-exempt, work-related new injury with nothing recordable. Tests change only what they need.
const BASE = {
  state: "Ohio", emp_small: "no", emp_naics: "336111", supervise: "me", injury: "yes", incident: { date: "2026-01-12", time: "09:00" },
  wr_env: "yes", wr_exception: "none", wr_travel: "no", wr_home: "no", preexist: "no", nc_prior: "no", sp_type: "none",
  gc_death: "no", gc_away: "no", gc_restricted: "no", mt_closure: "none", mt_support: "none", mt_therapy: "none", mt_immun: "none",
  mt_rx: "no", mt_other: "no", mt_recommended: "no", gc_loc: "no", gc_diag: "no", conflict: "no", privacy: "no", m_kind: "injury",
  rp_death: "no", rp_hosp: "no", rp_amp: "no", rp_eye: "no", rp_exception: "no",
};
const times = (event, learned = event, learnedWR = learned) => ({ event, learned, learnedWR });
const away = (start, end, source = "actual") => ({ kind: "away", source, start, end });
const restr = (start, end, source = "actual") => ({ kind: "restricted", source, start, end });
const dt = s => new Date(s);
// Rules checked through the 300 entry or the screens rather than a reason line.
const VIA_OUTPUT = new Set(["LOG-PRIVACY", "LOG-PRIVACY-DESC", "LOG-TYPE", "RPT-DEF", "SP-HEARING-AGE", "LOG-OUTCOME", "EMP-STATE"]);

const T = [];
const test = (name, facts, expect, rules) => T.push({ name, facts, expect, rules });

// ---------- General recording criteria ----------
test("All criteria No: not recordable", {}, { rec: "not", log: "required", rpt: "not" }, ["GC-MT", "EMP-SIZE", "RPT-DEATH"]);
test("Death", { gc_death: "yes" }, { rec: "recordable", outcome: "Death" }, ["GC-DEATH", "LOG-OUTCOME"]);
test("Days away, 5 actual days", { gc_away: "yes", days: { periods: [away("2026-01-13", "2026-01-17")] } }, { rec: "recordable", outcome: "Days away from work", K: 5, L: 0 }, ["GC-AWAY", "LOG-DAYS"]);
test("Days away recommended by a provider; employee came to work anyway", { gc_away: "yes", days: { periods: [away("2026-01-13", "2026-01-15", "provider")] } }, { rec: "recordable", outcome: "Days away from work", K: 3 }, ["GC-AWAY"]);
test("Restricted 10 days", { gc_restricted: "yes", days: { periods: [restr("2026-01-13", "2026-01-22")] } }, { rec: "recordable", outcome: "Job transfer or restriction", K: 0, L: 10 }, ["GC-RESTRICT", "LOG-DAYS"]);
test("Vague restriction the provider cannot clarify", { gc_restricted: "vague", days: { periods: [restr("2026-01-13", "2026-01-14", "provider")] } }, { rec: "recordable", outcome: "Job transfer or restriction", has: ["GC-RESTRICT-VAGUE"] }, ["GC-RESTRICT-VAGUE"]);
test("Sutures", { mt_closure: "mt" }, { rec: "recordable", outcome: "Other recordable case", K: 0, L: 0 }, ["GC-GLUE"]);
test("Steri-Strips only: first aid", { mt_closure: "firstaid" }, { rec: "not" }, []);
test("Rigid brace", { mt_support: "rigid" }, { rec: "recordable" }, ["GC-FIRSTAID"]);
test("Elastic wrap only: first aid", { mt_support: "nonrigid" }, { rec: "not" }, []);
test("Splint only for transport: first aid", { mt_support: "transport" }, { rec: "not" }, []);
test("Physical therapy", { mt_therapy: "pt" }, { rec: "recordable" }, ["GC-FIRSTAID"]);
test("Massage only: first aid", { mt_therapy: "massage" }, { rec: "not" }, []);
test("Hepatitis B vaccine", { mt_immun: "other" }, { rec: "recordable" }, ["GC-FIRSTAID"]);
test("Tetanus shot only: first aid", { mt_immun: "tetanus" }, { rec: "not" }, []);
test("Prescription-strength medication", { mt_rx: "yes", mt_rx_diag: "no" }, { rec: "recordable" }, ["GC-RX"]);
test("Medication used only for diagnosis", { mt_rx: "yes", mt_rx_diag: "yes" }, { rec: "not" }, []);
test("Unclear whether dose was above the OTC label: Needs review", { mt_rx: U }, { rec: "review" }, ["GC-RX", "TOOL-UNSURE"]);
test("Other treatment beyond first aid", { mt_other: "yes" }, { rec: "recordable" }, ["GC-MT"]);
test("Provider recommended treatment; employee refused", { mt_recommended: "yes" }, { rec: "recordable" }, ["GC-MT-RECOMMENDED"]);
test("Loss of consciousness", { gc_loc: "yes" }, { rec: "recordable" }, ["GC-LOC"]);
test("Diagnosed fracture or broken tooth, no treatment", { gc_diag: "yes" }, { rec: "recordable", has: ["GC-TOOTH"] }, ["GC-DIAG", "GC-TOOTH"]);
test("Two providers conflict: Needs review", { mt_other: "yes", conflict: "yes" }, { rec: "review", has: ["GC-CONFLICT"] }, ["GC-CONFLICT"]);
test("Day not known for one criterion but another is Yes: still recordable", { gc_loc: U, gc_diag: "yes" }, { rec: "recordable" }, []);

// ---------- Injury and work-relatedness ----------
test("No injury or illness", { injury: "no" }, { rec: "not", rpt: "na" }, ["INJ-DEF"]);
test("Not sure about injury but treatment given: Needs review, not No", { injury: U, mt_other: "yes" }, { rec: "review" }, ["INJ-DEF"]);
test("No work event or exposure", { wr_env: "no" }, { rec: "not", rpt: "na" }, ["WR-ENV"]);
test("Work event not sure, treatment given: Needs review", { wr_env: U, mt_other: "yes" }, { rec: "review" }, ["WR-ENV"]);
test("Work event not sure, every criterion No: stays Needs review (spec: an open work-relatedness question keeps Needs review)", { wr_env: U }, { rec: "review" }, []);
for (const [k, rule] of [["public", "WR-EXC-PUBLIC"], ["symptoms", "WR-EXC-SYMPTOMS"], ["wellness", "WR-EXC-WELLNESS"], ["food", "WR-EXC-FOOD"], ["personal", "WR-EXC-PERSONAL"], ["grooming", "WR-EXC-GROOMING"], ["commute", "WR-EXC-COMMUTE"], ["cold", "WR-EXC-COLD"], ["mental", "WR-EXC-MENTAL"]]) {
  test(`Exception: ${k}`, { wr_exception: k, mt_other: "yes", rp_hosp: "admitted" }, { rec: "not", rpt: "na", has: [rule] }, [rule]);
}
test("Exception not sure, treatment given: Needs review", { wr_exception: U, mt_other: "yes" }, { rec: "review" }, []);
test("Travel: personal side trip", { wr_travel: "yes", wr_travel_interest: "no", mt_other: "yes" }, { rec: "not", rpt: "na" }, ["WR-TRAVEL"]);
test("Travel: working in the employer's interest", { wr_travel: "yes", wr_travel_interest: "yes", mt_other: "yes" }, { rec: "recordable" }, []);
test("Work at home: general home environment", { wr_home: "yes", wr_home_direct: "no", mt_other: "yes" }, { rec: "not" }, ["WR-HOME"]);
test("Work at home: dropped box of work documents", { wr_home: "yes", wr_home_direct: "yes", mt_other: "yes" }, { rec: "recordable" }, []);
test("Pre-existing condition not significantly aggravated", { preexist: "yes", preexist_caused: "no", mt_other: "yes" }, { rec: "not" }, ["WR-PREEXIST"]);
test("Pre-existing condition significantly aggravated", { preexist: "yes", preexist_caused: "yes", mt_other: "yes" }, { rec: "recordable" }, ["WR-PREEXIST"]);
test("Pre-existing condition, aggravation unclear: Needs review", { preexist: "yes", preexist_caused: U, mt_other: "yes" }, { rec: "review" }, []);

// ---------- New case ----------
test("Prior case, not recovered: not a new case", { nc_prior: "yes", nc_hcp: "none", nc_chronic: "no", nc_recovered: "no", mt_other: "yes" }, { rec: "not" }, ["NC-NEW"]);
test("Prior case, fully recovered, new event: new case", { nc_prior: "yes", nc_hcp: "none", nc_chronic: "no", nc_recovered: "yes", mt_other: "yes" }, { rec: "recordable" }, ["NC-NEW"]);
test("Chronic illness recorded only once", { nc_prior: "yes", nc_hcp: "none", nc_chronic: "yes", mt_other: "yes" }, { rec: "not" }, ["NC-CHRONIC"]);
test("Provider says new case", { nc_prior: "yes", nc_hcp: "new", mt_other: "yes" }, { rec: "recordable" }, ["NC-HCP"]);
test("Provider says recurrence", { nc_prior: "yes", nc_hcp: "recur", mt_other: "yes" }, { rec: "not" }, ["NC-HCP"]);
test("Prior case not sure: Needs review", { nc_prior: U, mt_other: "yes" }, { rec: "review" }, []);

// ---------- Special cases ----------
test("Contaminated needlestick", { sp_type: "needle", ns_contam: "yes" }, { rec: "recordable", privacy: true, M: "Injury", has: ["SP-NEEDLE"] }, ["SP-NEEDLE", "LOG-PRIVACY", "LOG-PRIVACY-LIST", "LOG-PRIVACY-DESC", "SP-NEEDLE"]);
test("Uncontaminated sharp, first aid only", { sp_type: "needle", ns_contam: "no" }, { rec: "not" }, []);
test("Uncontaminated sharp, sutures", { sp_type: "needle", ns_contam: "no", mt_closure: "mt" }, { rec: "recordable", privacy: false }, []);
test("Contamination unknown: Needs review, not uncontaminated", { sp_type: "needle", ns_contam: U }, { rec: "review" }, []);
const HL = (b, c) => ({ L: { b2: b, b3: b, b4: b, c2: c, c3: c, c4: c }, R: { b2: 5, b3: 5, b4: 5, c2: 5, c3: 5, c4: 5 } });
const HEAR = { sp_type: "hearing", hl_hcp: "no", hl_revised: "no", hl_age: "no", hl_retest: "no" };
test("Hearing: STS and 25 dB in left ear", { ...HEAR, hl_levels: HL(10, 25) }, { rec: "recordable", M: "Hearing loss", outcome: "Other recordable case" }, ["SP-HEARING"]);
test("Hearing: STS but under 25 dB", { ...HEAR, hl_levels: HL(10, 20) }, { rec: "not" }, ["SP-HEARING"]);
test("Hearing: age correction removes the shift (male, 30 to 50)", { ...HEAR, hl_age: "yes", hl_age_data: { sex: "male", ageBase: 30, ageCur: 50 }, hl_levels: HL(15, 30) }, { rec: "not", hearingAdjusted: [15 - (5 + 10 + 13) / 3] }, ["SP-HEARING-AGE"]);
test("Hearing: age correction never applies to the 25 dB test", { ...HEAR, hl_age: "yes", hl_age_data: { sex: "female", ageBase: 25, ageCur: 26 }, hl_levels: HL(10, 25) }, { rec: "recordable" }, ["SP-HEARING-AGE"]);
test("Hearing: retest in 20 days did not confirm", { ...HEAR, hl_levels: HL(10, 25), hl_retest: "yes", hl_retest_data: { first: "2026-01-12", retest: "2026-02-01", confirmed: "no" } }, { rec: "not" }, ["SP-HEARING-RETEST"]);
test("Hearing: retest exactly 30 days, not confirmed", { ...HEAR, hl_levels: HL(10, 25), hl_retest: "yes", hl_retest_data: { first: "2026-01-12", retest: "2026-02-11", confirmed: "no" } }, { rec: "not" }, []);
test("Hearing: retest 31 days later does not cancel", { ...HEAR, hl_levels: HL(10, 25), hl_retest: "yes", hl_retest_data: { first: "2026-01-12", retest: "2026-02-12", confirmed: "no" } }, { rec: "recordable" }, ["SP-HEARING-RETEST"]);
test("Hearing: provider says not work-related", { ...HEAR, hl_hcp: "yes" }, { rec: "not" }, ["SP-HEARING-WR"]);
test("Hearing: a number is missing", { ...HEAR, hl_levels: { L: { b2: 10, b3: 10, b4: "", c2: 25, c3: 25, c4: 25 }, R: { b2: 5, b3: 5, b4: 5, c2: 5, c3: 5, c4: 5 } } }, { rec: "review" }, []);
test("TB: workplace exposure, positive test", { sp_type: "tb", tb_exposed: "yes", tb_positive: "yes", tb_excl: "no" }, { rec: "recordable", M: "Respiratory condition", privacy: true }, ["SP-TB"]);
test("TB: lives with someone with active TB", { sp_type: "tb", tb_exposed: "yes", tb_positive: "yes", tb_excl: "yes", mt_rx: "yes", mt_rx_diag: "no" }, { rec: "not" }, ["SP-TB"]);
test("TB: exclusion not sure", { sp_type: "tb", tb_exposed: "yes", tb_positive: "yes", tb_excl: U }, { rec: "review" }, []);
test("Medical removal (lead), kept off work", { sp_type: "removal", mr_standard: "lead", mr_voluntary: "no", mr_how: "away", days: { periods: [away("2026-01-13", "2026-01-22")] } }, { rec: "recordable", outcome: "Days away from work", M: "Poisoning", K: 10 }, ["SP-REMOVAL", "SP-REMOVAL-COL"]);
test("Medical removal (benzene), moved to other work", { sp_type: "removal", mr_standard: "benzene", mr_voluntary: "no", mr_how: "restricted", days: { periods: [restr("2026-01-13", "2026-01-14")] } }, { rec: "recordable", outcome: "Job transfer or restriction", M: "Poisoning", L: 2 }, []);
test("Voluntary early removal, nothing else", { sp_type: "removal", mr_standard: "cadmium", mr_voluntary: "yes" }, { rec: "not" }, ["SP-REMOVAL"]);

// ---------- Employer and covered employee ----------
test("10 or fewer employees, not asked: exempt from the log, still reports", { emp_small: "yes", emp_asked: "no", mt_other: "yes", rp_hosp: "admitted", rp_hosp_t: times("2026-01-12T11:00") }, { rec: "recordable", log: "exempt", rpt: "report" }, ["EMP-SIZE", "EMP-REPORT-ALL"]);
test("Partially exempt industry (NAICS 5411)", { emp_naics: "541110", emp_asked: "no", mt_other: "yes" }, { rec: "recordable", log: "exempt" }, ["EMP-NAICS"]);
test("Exempt but BLS asked in writing", { emp_small: "yes", emp_asked: "yes", mt_other: "yes" }, { log: "required" }, ["EMP-ASKED"]);
test("NAICS code unknown: log Needs review", { emp_naics: U, emp_asked: "no", mt_other: "yes" }, { rec: "recordable", log: "review" }, []);
test("Size not sure, industry not exempt: log Needs review", { emp_small: U, emp_naics: "3361" }, { log: "review" }, []);
test("Another employer supervises day to day", { supervise: "other", mt_other: "yes" }, { rec: "recordable", log: "other", has: ["COV-SUPERVISE"] }, ["COV-SUPERVISE"]);
test("Arizona: state-plan warning", { state: "Arizona" }, { stateLevel: "plan" }, ["EMP-STATE"]);
test("New York: public-sector state plan note", { state: "New York" }, { stateLevel: "public" }, []);
test("Recordable case on a required log gets the establishment note", { mt_other: "yes" }, { has: ["COV-ESTAB", "LOG-7DAY", "LOG-300A", "LOG-EFILE", "LOG-RETAIN", "LOG-ACCESS", "LOG-GOV"] }, ["COV-ESTAB", "LOG-7DAY", "LOG-300A", "LOG-EFILE", "LOG-RETAIN", "LOG-ACCESS", "LOG-GOV"]);

// ---------- Report to OSHA ----------
test("Hospital admission within 24 hours", { mt_other: "yes", rp_hosp: "admitted", rp_hosp_t: times("2026-01-12T15:00", "2026-01-12T16:00") }, { rpt: "report", deadline: dt("2026-01-13T16:00") }, ["RPT-SEVERE", "RPT-LATE", "RPT-HOW", "RPT-DEF"]);
test("Admission exactly 24 hours after the incident is within the window", { rp_hosp: "admitted", rp_hosp_t: times("2026-01-13T09:00") }, { rpt: "report", deadline: dt("2026-01-14T09:00") }, []);
test("Admission 27 hours after the incident: not reportable", { rp_hosp: "admitted", rp_hosp_t: times("2026-01-13T12:00") }, { rpt: "not" }, []);
test("Observation only: not reportable", { rp_hosp: "observation" }, { rpt: "not" }, []);
test("Learned it was work-related 3 days later: clock starts then", { rp_hosp: "admitted", rp_hosp_t: times("2026-01-12T15:00", "2026-01-12T16:00", "2026-01-15T10:00") }, { rpt: "report", deadline: dt("2026-01-16T10:00") }, ["RPT-LATE"]);
test("Death 29 days later: 8 hours", { gc_death: "yes", rp_death: "yes", rp_death_t: times("2026-02-10T08:00", "2026-02-10T09:30") }, { rec: "recordable", rpt: "report", deadline: dt("2026-02-10T17:30") }, ["RPT-DEATH"]);
test("Death exactly 30 days later is within the window", { gc_death: "yes", rp_death: "yes", rp_death_t: times("2026-02-11T09:00") }, { rpt: "report" }, []);
test("Death 31 days later: not reportable, still recordable", { gc_death: "yes", rp_death: "yes", rp_death_t: times("2026-02-12T09:00") }, { rec: "recordable", rpt: "not" }, []);
test("Fingertip amputation", { gc_diag: "yes", rp_amp: "yes", rp_amp_t: times("2026-01-12T09:00", "2026-01-12T09:10") }, { rpt: "report", deadline: dt("2026-01-13T09:10") }, []);
test("Loss of an eye", { rp_eye: "yes", rp_eye_t: times("2026-01-12T09:00") }, { rpt: "report" }, []);
test("Public highway crash: not reportable, still recordable", { mt_other: "yes", rp_hosp: "admitted", rp_hosp_t: times("2026-01-12T10:00"), rp_exception: "yes" }, { rec: "recordable", rpt: "not" }, ["RPT-EXC"]);
test("Missing learned time: tool does not guess the deadline", { rp_hosp: "admitted", rp_hosp_t: { event: "2026-01-12T10:00", learned: "", learnedWR: "" } }, { rpt: "review", urgent: true, deadline: null }, []);
test("Incident time unknown: window not confirmed, urgent notice still shown", { incident: { date: "2026-01-12", time: "" }, rp_amp: "yes", rp_amp_t: times("2026-01-12T10:00") }, { rpt: "review", urgent: true }, []);
test("Hospitalization not sure: Needs review", { rp_hosp: U }, { rpt: "review" }, []);
test("Exempt employer, death: still reportable", { emp_small: "yes", emp_asked: "no", gc_death: "yes", rp_death: "yes", rp_death_t: times("2026-01-12T12:00") }, { log: "exempt", rpt: "report" }, []);

// ---------- Privacy and log entry ----------
test("Privacy case by list (intimate body part)", { mt_other: "yes", privacy: "yes" }, { privacy: true, name: "Privacy case" }, ["LOG-PRIVACY"]);
test("Not a privacy case shows a name placeholder", { mt_other: "yes" }, { privacy: false, name: "[Employee name]" }, []);
test("Illness: skin disorder", { mt_other: "yes", m_kind: "illness", m_ill: "skin" }, { M: "Skin disorder" }, ["LOG-TYPE"]);
test("Facts may change: update-the-entry reminder", { mt_other: "yes" }, { has: ["TOOL-UNSURE"] }, []);

// ---------- Day counting (countDays directly) ----------
const DAYS = [];
const dtest = (name, periods, extra, expect, rules) => DAYS.push({ name, D: { periods, ...extra }, expect, rules });
dtest("Day of injury not counted", [away("2026-01-12", "2026-01-14")], {}, { away: 2 }, ["LOG-DAYS"]);
dtest("Weekends count", [away("2026-01-16", "2026-01-19")], {}, { away: 4 }, []);
dtest("No day counted twice (away wins)", [away("2026-01-13", "2026-01-17"), restr("2026-01-15", "2026-01-20")], {}, { away: 5, restricted: 3 }, []);
dtest("Provider release ends days away even if employee stays out", [away("2026-01-13", "2026-01-31")], { rtwAway: "2026-01-20" }, { away: 7, restricted: 0 }, []);
dtest("Provider release to restricted, then restricted period", [away("2026-01-13", "2026-01-31"), restr("2026-01-20", "2026-01-25", "provider")], { rtwAway: "2026-01-20" }, { away: 7, restricted: 6 }, []);
dtest("Full-duty release ends all counting", [restr("2026-01-13", "2026-01-31")], { rtwFull: "2026-01-23" }, { restricted: 10 }, []);
dtest("Unrelated separation stops counting", [away("2026-01-13", "2026-02-28")], { separation: "2026-01-18" }, { away: 5 }, []);
dtest("Permanent modification: at least one restricted day", [restr("2026-01-13", "2026-02-28")], { permMod: "2026-01-13" }, { restricted: 1 }, []);
dtest("Permanent modification after 5 days", [restr("2026-01-13", "2026-02-28")], { permMod: "2026-01-18" }, { restricted: 5 }, []);
dtest("180-day cap on restricted", [restr("2026-01-13", "2026-12-31")], {}, { restricted: 180, capped: true }, ["LOG-DAYS"]);
dtest("179 restricted days: not capped", [restr("2026-01-13", "2026-07-10")], {}, { restricted: 179, capped: false }, []);
dtest("180 restricted days exactly: not capped", [restr("2026-01-13", "2026-07-11")], {}, { restricted: 180, capped: false }, []);
dtest("Combined cap: 10 away then restricted", [away("2026-01-13", "2026-01-22"), restr("2026-01-23", "2026-12-31")], {}, { away: 10, restricted: 170, capped: true }, []);
dtest("FAQ 7-18: 180 restricted then days away", [restr("2026-01-13", "2026-07-11"), away("2026-07-12", "2026-08-01")], {}, { away: 0, restricted: 180, capped: true, anyAway: true, has: ["LOG-180"] }, ["LOG-180"]);
dtest("Open period counted through the as-of date", [away("2026-01-13", "")], { asOf: "2026-01-20" }, { away: 8, open: true }, []);
dtest("Conflicting provider directions are flagged", [away("2026-01-13", "2026-01-16", "provider"), restr("2026-01-15", "2026-01-20", "provider")], {}, { away: 4, restricted: 4, has: ["GC-CONFLICT"] }, []);

// ---------- Run ----------
let failures = 0, checks = 0;
const covered = new Map(Object.keys(RULES).map(k => [k, []]));
const ok = (cond, msg) => { checks++; if (!cond) { failures++; console.log("FAIL " + msg); } };
const emitted = res => {
  const all = [...res.rec.reasons, ...res.rec.review, ...res.rec.notes, ...res.log.reasons, ...res.rpt.reasons, ...res.actions, ...(res.entry?.days?.notes || [])];
  return new Set(all.map(r => r.rule));
};

for (const t of T) {
  const A = prune(structuredClone({ ...BASE, ...t.facts }));
  const res = evaluate(A, new Date("2026-01-20T12:00"));
  const e = t.expect, got = emitted(res), n = t.name;
  if (e.rec) ok(res.rec.status === e.rec, `${n}: recordability ${res.rec.status}, expected ${e.rec}`);
  if (e.log) ok(res.log.status === e.log, `${n}: log ${res.log.status}, expected ${e.log}`);
  if (e.rpt) ok(res.rpt.status === e.rpt, `${n}: reporting ${res.rpt.status}, expected ${e.rpt}`);
  if ("urgent" in e) ok(res.rpt.urgent === e.urgent, `${n}: urgent ${res.rpt.urgent}`);
  if (e.outcome) ok(res.entry?.outcome === e.outcome, `${n}: outcome ${res.entry?.outcome}, expected ${e.outcome}`);
  if ("K" in e) ok(res.entry?.K === e.K, `${n}: K ${res.entry?.K}, expected ${e.K}`);
  if ("L" in e) ok(res.entry?.L === e.L, `${n}: L ${res.entry?.L}, expected ${e.L}`);
  if (e.M) ok(res.entry?.M === e.M, `${n}: M ${res.entry?.M}, expected ${e.M}`);
  if ("privacy" in e) ok(res.entry?.privacy === e.privacy, `${n}: privacy ${res.entry?.privacy}`);
  if (e.name) ok(res.entry?.B === e.name, `${n}: name column ${res.entry?.B}`);
  if (e.stateLevel) ok(res.state.level === e.stateLevel, `${n}: state level ${res.state.level}`);
  if ("deadline" in e) {
    const d = res.rpt.events.find(x => x.status !== "not")?.deadline ?? null;
    ok(e.deadline === null ? d === null || d === undefined : d && d.getTime() === e.deadline.getTime(), `${n}: deadline ${d}, expected ${e.deadline}`);
  }
  if (e.hearingAdjusted) ok(Math.abs(res.rec.sp.hearing.ears.L.adjusted - e.hearingAdjusted[0]) < 1e-9, `${n}: age-adjusted change ${res.rec.sp.hearing.ears.L.adjusted}`);
  for (const r of e.has || []) ok(got.has(r), `${n}: expected a reason citing ${r}`);
  for (const r of t.rules) {
    ok(got.has(r) || VIA_OUTPUT.has(r), `${n}: checks ${r} but no result cites it`);
    covered.get(r)?.push(n);
  }
  // Every question that applies to these facts has an answer (the facts walk the real flow).
  const missing = visible(A).filter(q => !(q.id in A)).map(q => q.id);
  ok(!missing.length || t.facts.allowMissing, `${n}: questions left unanswered: ${missing.join(", ")}`);
}

for (const t of DAYS) {
  const r = countDays("2026-01-12", t.D), e = t.expect, n = "Days: " + t.name;
  for (const k of ["away", "restricted", "capped", "open", "anyAway"]) if (k in e) ok(r[k] === e[k], `${n}: ${k} ${r[k]}, expected ${e[k]}`);
  const got = new Set(r.notes.map(x => x.rule));
  for (const x of e.has || []) ok(got.has(x), `${n}: expected a note citing ${x}`);
  for (const x of t.rules) covered.get(x)?.push(n);
}

// ---------- Flow behavior ----------
{
  // Employer questions are never skipped; NAICS is skipped when the size exemption already applies.
  const v = visible({ emp_small: "yes" }).map(q => q.id);
  ok(v.includes("state") && v.includes("emp_asked") && !v.includes("emp_naics"), "flow: size exemption skips NAICS, keeps the written-request question");
  // Changing an earlier answer clears later answers that depended on it.
  const A = prune({ ...BASE, wr_travel: "yes", wr_travel_interest: "no" });
  ok(!("nc_prior" in A), "flow: a ruled-out case clears the new-case answers");
  A.wr_travel = "no"; prune(A);
  ok(!("wr_travel_interest" in A), "flow: changing travel to No clears the travel follow-up");
  const B = prune({ ...BASE, sp_type: "needle", ns_contam: "yes" });
  B.sp_type = "none"; prune(B);
  ok(!("ns_contam" in B), "flow: changing the special case clears its questions");
  // The report-to-OSHA check is asked for every work-related case, recordable or not.
  ok(visible(prune({ ...BASE })).some(q => q.id === "rp_hosp"), "flow: report check asked for a work-related, not-recordable case");
  ok(!visible(prune({ ...BASE, wr_env: "no" })).some(q => q.id === "rp_hosp"), "flow: report check skipped when not work-related");
  // Not sure leads on to the next question, never to an early No.
  ok(visible(prune({ ...BASE, wr_env: U })).some(q => q.id === "wr_exception"), "flow: Not sure on work event continues to the exceptions");
  // Every question offers Not sure (yes/no and choice questions; data screens have their own Not sure or blank boxes).
  ok(QUESTIONS.every(q => q.type !== "choice" || !q.options.some(o => o[0] === U)), "flow: choice options leave Not sure to the screen");
  // Back and Next walk the visible list.
  ok(step({}, "state", 1) === "emp_small" && step({}, "emp_small", -1) === "state", "flow: Back and Next move one question");
  // NAICS list is the 82-code Appendix A list.
  ok(Object.keys(NAICS_EXEMPT).length === 82, "rules: Appendix A list has 82 codes");
}

// ---------- Rule coverage ----------
const uncovered = [...covered].filter(([, ts]) => !ts.length).map(([k]) => k);
ok(!uncovered.length, `rules not checked by any test: ${uncovered.join(", ")}`);
if (process.argv.includes("--coverage")) for (const [k, ts] of covered) console.log(`${k.padEnd(20)} ${RULES[k].cite.padEnd(42)} ${ts.length} test(s)`);

console.log(`${T.length + DAYS.length} test incidents, ${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
