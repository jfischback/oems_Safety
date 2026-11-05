// Decision logic for the Recordability Determination Tool. Pure functions: answers in, determination out.
// Nothing here stores or sends anything. Every reason carries a rule ID from rules.js.
import { RULES, NAICS_EXEMPT, STATE_PLANS_ALL, STATE_PLANS_PUBLIC, ageCorrection } from "./rules.js";

export const U = "unsure";
const isUnsure = v => v === U || v === undefined || v === null || v === "";
const why = (rule, text) => ({ rule, text });

// ---------- Employer ----------
export function naicsExempt(A) {
  const v = A.emp_naics;
  if (isUnsure(v)) return U;
  const code = String(v).replace(/\D/g, "").slice(0, 4);
  if (code.length < 4) return U;
  return NAICS_EXEMPT[code] ? "yes" : "no";
}

export function exemptCandidate(A) {
  if (A.emp_small === "yes") return "yes";
  const n = naicsExempt(A);
  if (n === "yes") return "yes";
  if (isUnsure(A.emp_small) || n === U) return U;
  return "no";
}

export function stateNote(A) {
  const s = A.state;
  if (isUnsure(s)) return { level: "unknown", text: "State not given. Federal baseline only; if the incident happened in a state-plan state, verify the state plan's recordkeeping and reporting rules." };
  if (STATE_PLANS_ALL.includes(s)) return { level: "plan", text: `${s} has an OSHA-approved state plan. Federal baseline only; verify the state plan's recordkeeping and reporting rules.` };
  if (STATE_PLANS_PUBLIC.includes(s)) return { level: "public", text: `${s} has a state plan that covers state and local government workers. If you are a state or local government employer, the results are federal baseline only; verify the state plan's recordkeeping and reporting rules.` };
  return { level: "federal", text: `${s} is under federal OSHA for private employers.` };
}

export function logStatus(A) {
  const reasons = [];
  if (A.supervise === "other") {
    reasons.push(why("COV-SUPERVISE", "Another employer supervises this worker day to day, so that employer records the case. This is not the same as Not recordable."));
    return { status: "other", label: "Not your OSHA 300 entry", reasons };
  }
  let review = false;
  if (isUnsure(A.supervise)) { review = true; reasons.push(why("COV-SUPERVISE", "It is not known who supervises this worker day to day. The employer that supervises day to day records the case.")); }
  const cand = exemptCandidate(A);
  if (cand === "yes") {
    if (A.emp_small === "yes") reasons.push(why("EMP-SIZE", "The company had 10 or fewer employees at all times during the last calendar year."));
    if (naicsExempt(A) === "yes") reasons.push(why("EMP-NAICS", `NAICS ${String(A.emp_naics).slice(0, 4)} (${NAICS_EXEMPT[String(A.emp_naics).replace(/\D/g, "").slice(0, 4)]}) is listed in Appendix A to Subpart B.`));
    if (A.emp_asked === "yes") {
      reasons.push(why("EMP-ASKED", "OSHA or BLS asked the company in writing to keep records, so the exemption does not apply."));
    } else if (A.emp_asked === "no") {
      reasons.push(why("EMP-REPORT-ALL", "Being exempt only changes the log answer. Severe events must still be reported to OSHA."));
      return { status: review ? "review" : "exempt", label: review ? "Needs review" : "Not required (exempt)", reasons };
    } else {
      reasons.push(why("EMP-ASKED", "It is not known whether OSHA or BLS asked the company in writing to keep records."));
      return { status: "review", label: "Needs review", reasons };
    }
  } else if (cand === U) {
    if (isUnsure(A.emp_small)) reasons.push(why("EMP-SIZE", "It is not known whether the company had 10 or fewer employees at all times last calendar year."));
    if (naicsExempt(A) === U && A.emp_small !== "yes") reasons.push(why("EMP-NAICS", "The establishment's NAICS code is not known. Verify it to check the partial exemption."));
    return { status: "review", label: "Needs review", reasons };
  } else {
    reasons.push(why("EMP-SIZE", "The company is not exempt by size or industry."));
  }
  return { status: review ? "review" : "required", label: review ? "Needs review" : "Required", reasons };
}

// ---------- Work-relatedness ----------
export const EXCEPTIONS = {
  public: ["WR-EXC-PUBLIC", "The person was present as a member of the general public, not as an employee"],
  symptoms: ["WR-EXC-SYMPTOMS", "Symptoms appeared at work but came solely from a non-work event or exposure"],
  wellness: ["WR-EXC-WELLNESS", "It came solely from voluntary participation in a wellness, medical, fitness or recreational activity (for example a flu shot or exercise class)"],
  food: ["WR-EXC-FOOD", "It came solely from eating, drinking or preparing food for personal consumption (not food contaminated by workplace contaminants, and not food poisoning from food the employer supplied)"],
  personal: ["WR-EXC-PERSONAL", "It came solely from personal tasks outside assigned working hours"],
  grooming: ["WR-EXC-GROOMING", "It came solely from personal grooming, self-medication for a non-work condition, or was intentionally self-inflicted"],
  commute: ["WR-EXC-COMMUTE", "A motor vehicle accident in a company parking lot or on a company access road while commuting"],
  cold: ["WR-EXC-COLD", "Common cold or flu"],
  mental: ["WR-EXC-MENTAL", "Mental illness, and the employee has not voluntarily given a physician's or licensed health care professional's opinion that it is work-related"],
};
export const isException = v => !!EXCEPTIONS[v];

// Returns "yes" | "no" | U, with reasons. "no" means work-relatedness is ruled out.
export function workRelated(A) {
  const reasons = [];
  if (A.injury === "no") return { status: "no", reasons: [why("INJ-DEF", "The employee did not have an injury or illness.")] };
  let open = false;
  if (isUnsure(A.injury)) { open = true; reasons.push(why("INJ-DEF", "It is not known whether there was an injury or illness.")); }
  if (A.wr_env === "no") return { status: "no", reasons: [...reasons, why("WR-ENV", "No event or exposure in the work environment caused or contributed to it or significantly aggravated a pre-existing condition.")] };
  if (isUnsure(A.wr_env)) { open = true; reasons.push(why("WR-ENV", "It is not known whether a work event or exposure caused or contributed to it.")); }
  else reasons.push(why("WR-ENV", "An event or exposure in the work environment caused or contributed to it."));
  if (isException(A.wr_exception)) {
    const [rule, text] = EXCEPTIONS[A.wr_exception];
    return { status: "no", reasons: [...reasons, why(rule, `Exception applies: ${text}.`)] };
  }
  if (isUnsure(A.wr_exception)) { open = true; reasons.push(why("WR-ENV", "It is not known whether a work-relatedness exception applies.")); }
  if (A.wr_travel === "yes") {
    if (A.wr_travel_interest === "no") return { status: "no", reasons: [...reasons, why("WR-TRAVEL", "The employee was traveling but was not doing work in the interest of the employer at the time.")] };
    if (isUnsure(A.wr_travel_interest)) { open = true; reasons.push(why("WR-TRAVEL", "It is not known whether the traveling employee was doing work in the interest of the employer.")); }
  } else if (isUnsure(A.wr_travel)) { open = true; reasons.push(why("WR-TRAVEL", "It is not known whether the employee was traveling for work.")); }
  if (A.wr_home === "yes") {
    if (A.wr_home_direct === "no") return { status: "no", reasons: [...reasons, why("WR-HOME", "The employee was working at home and it came from the general home environment, not directly from the work.")] };
    if (isUnsure(A.wr_home_direct)) { open = true; reasons.push(why("WR-HOME", "It is not known whether the at-home case came directly from the work.")); }
  } else if (isUnsure(A.wr_home)) { open = true; reasons.push(why("WR-HOME", "It is not known whether the employee was working at home.")); }
  if (A.preexist === "yes") {
    if (A.preexist_caused === "no") return { status: "no", reasons: [...reasons, why("WR-PREEXIST", "There was a pre-existing condition and the work event did not significantly aggravate it.")] };
    if (isUnsure(A.preexist_caused)) { open = true; reasons.push(why("WR-PREEXIST", "It is not clear whether the work event caused one of the significant-aggravation outcomes.")); }
    else reasons.push(why("WR-PREEXIST", "The work event significantly aggravated a pre-existing condition."));
  } else if (isUnsure(A.preexist)) { open = true; reasons.push(why("WR-PREEXIST", "It is not known whether there was a pre-existing condition.")); }
  return { status: open ? U : "yes", reasons };
}

// ---------- New case ----------
export function newCase(A) {
  if (A.nc_prior === "no") return { status: "yes", reasons: [why("NC-NEW", "No earlier recorded case of the same type to the same body part.")] };
  if (isUnsure(A.nc_prior)) return { status: U, reasons: [why("NC-NEW", "It is not known whether the employee already had a recorded case of the same type to the same body part.")] };
  if (A.nc_hcp === "new") return { status: "yes", reasons: [why("NC-HCP", "A physician or licensed health care professional says it is a new case.")] };
  if (A.nc_hcp === "recur") return { status: "no", reasons: [why("NC-HCP", "A physician or licensed health care professional says it is a recurrence of the earlier case. Update the existing log entry instead.")] };
  const reasons = [];
  if (isUnsure(A.nc_hcp)) reasons.push(why("NC-HCP", "It is not known whether a provider gave an opinion on new versus recurring."));
  if (A.nc_chronic === "yes") return { status: "no", reasons: [...reasons, why("NC-CHRONIC", "It is a chronic illness that can recur without new exposure, so it is recorded only once. Update the existing log entry instead.")] };
  if (A.nc_recovered === "yes" && A.nc_chronic === "no") return { status: reasons.length ? U : "yes", reasons: [...reasons, why("NC-NEW", "The employee had fully recovered before a new workplace event or exposure brought it back.")] };
  if (A.nc_recovered === "no" && A.nc_chronic === "no") return { status: "no", reasons: [...reasons, why("NC-NEW", "The employee had not fully recovered from the earlier case. Not a new case; update the existing log entry instead.")] };
  return { status: U, reasons: [...reasons, why("NC-NEW", "It is not clear whether this is a new case or a continuation of the earlier one.")] };
}

// ---------- Hearing loss ----------
const FREQ = ["2", "3", "4"];
const avg = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const num = v => (v === "" || v === null || v === undefined || isNaN(Number(v))) ? null : Number(v);

export function hearing(A) {
  const lv = A.hl_levels, out = { ears: {}, missing: [], review: false, reasons: [] };
  if (isUnsure(lv) || typeof lv !== "object") { out.missing.push("Audiogram levels"); out.review = true; return out; }
  const useAge = A.hl_age === "yes";
  let ages = null;
  if (useAge) {
    const d = A.hl_age_data;
    if (isUnsure(d) || !d.sex || num(d.ageBase) === null || num(d.ageCur) === null) { out.missing.push("Sex and ages for the age correction"); out.review = true; }
    else ages = { base: ageCorrection(d.sex, num(d.ageBase)), cur: ageCorrection(d.sex, num(d.ageCur)) };
  }
  for (const ear of ["L", "R"]) {
    const e = lv[ear] || {};
    const b = FREQ.map(f => num(e["b" + f])), c = FREQ.map(f => num(e["c" + f]));
    if ([...b, ...c].some(x => x === null)) { out.missing.push(`${ear === "L" ? "Left" : "Right"} ear levels`); out.review = true; continue; }
    const change = avg(c) - avg(b);
    const ageAdj = ages ? avg(FREQ.map((_, i) => ages.cur[i] - ages.base[i])) : null;
    const adjusted = ages ? change - ageAdj : null;
    const shift = (adjusted ?? change);
    const current = avg(c);
    out.ears[ear] = { base: b, cur: c, baseAvg: avg(b), curAvg: current, change, ageAdj, adjusted, sts: shift >= 10, over25: current >= 25, ageCorr: ages ? { base: ages.base, cur: ages.cur } : null };
  }
  return out;
}

const daysBetween = (a, b) => Math.round((Date.UTC(...b.split("-").map((x, i) => i === 1 ? x - 1 : +x)) - Date.UTC(...a.split("-").map((x, i) => i === 1 ? x - 1 : +x))) / 86400000);

// ---------- Special cases ----------
// decided: "recordable" | "not" | null (null = use the general criteria); review: an open question remains.
export function special(A) {
  const t = A.sp_type, r = { type: t, decided: null, review: false, reasons: [], mType: null, privacy: false, hearing: null };
  if (isUnsure(t)) { r.review = true; r.reasons.push(why("TOOL-UNSURE", "It is not known whether a special case (needlestick, hearing loss, TB or medical removal) applies.")); return r; }
  if (t === "needle") {
    if (A.ns_contam === "yes") Object.assign(r, { decided: "recordable", mType: "Injury", privacy: true, reasons: [why("SP-NEEDLE", "Needlestick or sharps cut contaminated with another person's blood or other potentially infectious material.")] });
    else if (A.ns_contam === "no") r.reasons.push(why("SP-NEEDLE", "The sharp was not contaminated, so the case goes through the general criteria."));
    else { r.review = true; r.reasons.push(why("SP-NEEDLE", "No one knows whether the sharp was contaminated. This is Needs review, not uncontaminated.")); }
  } else if (t === "hearing") {
    const h = hearing(A); r.hearing = h;
    if (A.hl_hcp === "yes") return Object.assign(r, { decided: "not", reasons: [why("SP-HEARING-WR", "A physician or licensed health care professional determined the hearing loss is not work-related or was not significantly aggravated by occupational noise.")] });
    if (isUnsure(A.hl_hcp)) { r.review = true; r.reasons.push(why("SP-HEARING-WR", "It is not known whether a provider determined the hearing loss is not work-related.")); }
    if (A.hl_revised !== "yes" && A.hl_revised !== "no") { r.review = true; r.reasons.push(why("SP-HEARING", "It is not known whether the baseline audiogram was revised.")); }
    if (h.missing.length) { r.review = true; r.reasons.push(why("SP-HEARING", `Missing: ${h.missing.join(", ")}.`)); return r; }
    const recordEars = Object.entries(h.ears).filter(([, e]) => e.sts && e.over25).map(([k]) => k === "L" ? "left" : "right");
    // Retest
    let retestClears = false;
    if (A.hl_retest === "yes") {
      const d = A.hl_retest_data;
      if (isUnsure(d) || !d.first || !d.retest || !d.confirmed) { r.review = true; r.reasons.push(why("SP-HEARING-RETEST", "Retest dates or result are missing.")); }
      else {
        const gap = daysBetween(d.first, d.retest);
        r.retestGap = gap;
        if (gap < 0) { r.review = true; r.reasons.push(why("SP-HEARING-RETEST", "The retest date is before the first audiogram date.")); }
        else if (gap <= 30 && d.confirmed === "no") retestClears = true;
        else if (gap > 30) r.reasons.push(why("SP-HEARING-RETEST", `The retest was ${gap} days after the first audiogram, outside the 30-day window, so it does not cancel the shift.`));
        else r.reasons.push(why("SP-HEARING-RETEST", `The retest ${gap} days after the first audiogram confirmed the shift. Record it within 7 days of the retest.`));
      }
    } else if (isUnsure(A.hl_retest)) { r.review = true; r.reasons.push(why("SP-HEARING-RETEST", "It is not known whether there was a retest.")); }
    if (retestClears && recordEars.length) return Object.assign(r, { decided: "not", reasons: [...r.reasons, why("SP-HEARING-RETEST", "A retest within 30 days did not confirm the shift, so it need not be recorded.")] });
    if (recordEars.length) {
      if (r.review) return r;
      return Object.assign(r, { decided: "recordable", mType: "Hearing loss", reasons: [...r.reasons, why("SP-HEARING", `Standard threshold shift with a hearing level of 25 dB or more in the ${recordEars.join(" and ")} ear.`)] });
    }
    if (r.review) return r;
    return Object.assign(r, { decided: "not", reasons: [...r.reasons, why("SP-HEARING", "Neither ear has both a standard threshold shift and a hearing level of 25 dB or more.")] });
  } else if (t === "tb") {
    if (A.tb_exposed === "yes") {
      if (A.tb_positive === "yes") {
        if (A.tb_excl === "yes") Object.assign(r, { decided: "not", reasons: [why("SP-TB", "One of the TB exclusions applies (household exposure, an unrelated public health contact, an outside source shown by medical investigation, or a positive pre-employment test).")] });
        else if (A.tb_excl === "no") Object.assign(r, { decided: "recordable", mType: "Respiratory condition", privacy: true, reasons: [why("SP-TB", "Exposed at work to a known case of active TB, then a positive skin test or diagnosis.")] });
        else { r.review = true; r.reasons.push(why("SP-TB", "It is not known whether a TB exclusion applies.")); }
      } else if (A.tb_positive === "no") r.reasons.push(why("SP-TB", "No positive skin test or diagnosis, so the TB rule does not record it; the general criteria apply."));
      else { r.review = true; r.reasons.push(why("SP-TB", "It is not known whether there was a positive skin test or diagnosis.")); }
    } else if (A.tb_exposed === "no") r.reasons.push(why("SP-TB", "No known workplace exposure to active TB, so the TB rule does not record it; the general criteria apply."));
    else { r.review = true; r.reasons.push(why("SP-TB", "It is not known whether the employee was exposed at work to a known case of active TB.")); }
  } else if (t === "removal") {
    if (isUnsure(A.mr_standard)) { r.review = true; r.reasons.push(why("SP-REMOVAL", "The OSHA standard requiring the removal is not known.")); }
    if (A.mr_voluntary === "yes") r.reasons.push(why("SP-REMOVAL", "Voluntary removal before the standard's removal levels were reached: not recorded under 1904.9; the general criteria apply."));
    else if (A.mr_voluntary === "no") {
      r.decided = "recordable";
      r.reasons.push(why("SP-REMOVAL", `Medical removal under an OSHA standard${A.mr_how === "away" ? ", kept off work entirely (days away)" : A.mr_how === "restricted" ? ", moved to other work or restricted (restricted case)" : ""}.`));
      if (isUnsure(A.mr_how)) { r.review = true; r.reasons.push(why("SP-REMOVAL", "It is not known whether the employee was kept off work entirely or moved to other work, which decides days away versus restricted.")); }
      if (["lead", "cadmium", "benzene", "formaldehyde", "methylene"].includes(A.mr_standard)) { r.mType = "Poisoning"; r.reasons.push(why("SP-REMOVAL-COL", "The removal came from a chemical exposure, so it goes in the poisoning column.")); }
    } else { r.review = true; r.reasons.push(why("SP-REMOVAL", "It is not known whether the removal was voluntary before the standard's removal levels were reached.")); }
  }
  return r;
}

// ---------- General recording criteria ----------
export function treatment(A) {
  const yes = [], unsure = [];
  const add = (cond, rule, text, list) => { if (cond) list.push(why(rule, text)); };
  add(A.mt_closure === "mt", "GC-GLUE", "Wound closed with sutures, staples or medical glue (medical treatment).", yes);
  add(isUnsure(A.mt_closure), "GC-MT", "How the wound was closed is not known.", unsure);
  add(A.mt_support === "rigid", "GC-FIRSTAID", "Rigid support or a device that immobilizes a body part (medical treatment).", yes);
  add(isUnsure(A.mt_support), "GC-MT", "The type of support used is not known.", unsure);
  add(A.mt_therapy === "pt", "GC-FIRSTAID", "Physical therapy or chiropractic treatment (medical treatment).", yes);
  add(isUnsure(A.mt_therapy), "GC-MT", "Whether physical therapy or chiropractic care was given is not known.", unsure);
  add(A.mt_immun === "other", "GC-FIRSTAID", "An immunization other than tetanus (medical treatment).", yes);
  add(isUnsure(A.mt_immun), "GC-MT", "Which immunization was given is not known.", unsure);
  if (A.mt_rx === "yes") {
    add(A.mt_rx_diag === "no", "GC-RX", "Prescription medication, or an over-the-counter medication at prescription strength, was given or recommended (medical treatment).", yes);
    add(isUnsure(A.mt_rx_diag), "GC-RX", "It is not known whether the medication was used only for diagnosis.", unsure);
  }
  add(isUnsure(A.mt_rx), "GC-RX", "It is not clear whether the dose was above the over-the-counter label's single dose.", unsure);
  add(A.mt_other === "yes", "GC-MT", "Other treatment not on the first aid list was given (medical treatment).", yes);
  add(isUnsure(A.mt_other), "GC-MT", "It is not known whether other treatment beyond first aid was given.", unsure);
  add(A.mt_recommended === "yes", "GC-MT-RECOMMENDED", "A physician or licensed health care professional recommended treatment beyond first aid (counts even if refused or not followed).", yes);
  add(isUnsure(A.mt_recommended), "GC-MT-RECOMMENDED", "It is not known whether a provider recommended treatment beyond first aid.", unsure);
  return { yes, unsure };
}

export function criteria(A) {
  const met = [], unsure = [], notes = [];
  const q = (v, rule, yesText, unsureText) => { if (v === "yes") met.push(why(rule, yesText)); else if (isUnsure(v)) unsure.push(why(rule, unsureText)); };
  q(A.gc_death, "GC-DEATH", "Death.", "It is not known whether the employee died.");
  q(A.gc_away, "GC-AWAY", "Days away from work (or a provider recommended days away).", "It is not known whether there were days away from work.");
  if (A.gc_restricted === "yes") met.push(why("GC-RESTRICT", "Restricted work or job transfer."));
  else if (A.gc_restricted === "vague") { met.push(why("GC-RESTRICT-VAGUE", "A vague restriction the provider could not clarify is recorded as restricted.")); notes.push(why("GC-RESTRICT-VAGUE", "Document the attempt to get the restriction clarified.")); }
  else if (isUnsure(A.gc_restricted)) unsure.push(why("GC-RESTRICT", "It is not known whether there was restricted work or a job transfer."));
  const t = treatment(A);
  met.push(...t.yes); unsure.push(...t.unsure);
  q(A.gc_loc, "GC-LOC", "Loss of consciousness.", "It is not known whether the employee lost consciousness.");
  q(A.gc_diag, "GC-DIAG", "Significant diagnosis (cancer, chronic irreversible disease, fractured or cracked bone or tooth, or punctured eardrum).", "It is not known whether there was a significant diagnosis.");
  if (A.gc_diag === "yes") notes.push(why("GC-TOOTH", "A diagnosed chipped, broken or fractured tooth counts like a fracture."));
  return { met, unsure, notes };
}

// ---------- Day counting ----------
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export function countDays(injuryDate, D) {
  const res = { away: 0, restricted: 0, ranges: [], notes: [], open: false, capped: false, error: null, anyAway: false };
  if (!injuryDate) { res.error = "The injury date is needed to count days."; return res; }
  if (isUnsure(D) || typeof D !== "object") { res.error = "Day-count dates were not entered."; return res; }
  const periods = (D.periods || []).filter(p => p && p.start);
  const asOf = D.asOf || null;
  for (const p of periods) {
    if (!p.end) { res.open = true; if (!asOf) { res.error = "A period has no end date. Enter an as-of date to count the case so far."; return res; } }
    if (p.start <= injuryDate) res.notes.push(why("LOG-DAYS", `A period starting ${p.start} begins on or before the injury date; the day of injury is not counted.`));
  }
  if (!periods.length) { res.error = "No day-away or restricted periods were entered."; return res; }
  const ends = periods.map(p => p.end || asOf);
  let last = ends.sort().at(-1);
  // Stop dates: provider release, unrelated separation, permanent modification.
  const stopAll = D.separation || null;
  const day = [];
  for (let d = addDays(injuryDate, 1); d <= last; d = addDays(d, 1)) {
    if (stopAll && d >= stopAll) break;
    const covers = kind => periods.some(p => p.kind === kind && p.start <= d && d <= (p.end || asOf));
    let kind = null;
    if (covers("away") && !(D.rtwAway && d >= D.rtwAway) && !(D.rtwFull && d >= D.rtwFull)) kind = "away";
    else if (covers("restricted") && !(D.rtwFull && d >= D.rtwFull)) kind = "restricted";
    day.push([d, kind]);
  }
  if (stopAll) res.notes.push(why("LOG-DAYS", `Counting stops on ${stopAll}, when the employee left for a reason unrelated to the case.`));
  if (D.rtwAway) res.notes.push(why("LOG-DAYS", `The provider's return-to-work date (${D.rtwAway}) ends the days-away count, even if the employee stayed out. Days after it count only if a restricted period covers them.`));
  if (D.rtwFull) res.notes.push(why("LOG-DAYS", `The provider's full-duty release date (${D.rtwFull}) ends the count.`));
  // Permanent job modification: restricted days stop, but at least one restricted day counts.
  if (D.permMod) {
    let rBefore = day.filter(([d, k]) => k === "restricted" && d < D.permMod).length;
    const rAfter = day.filter(([d, k]) => k === "restricted" && d >= D.permMod).length;
    for (const x of day) if (x[1] === "restricted" && x[0] >= D.permMod) x[1] = null;
    if (rBefore === 0 && rAfter > 0) { const first = day.find(([d]) => d >= D.permMod); if (first) first[1] = "restricted"; }
    res.notes.push(why("LOG-DAYS", `The job was permanently modified on ${D.permMod}, so restricted days stop counting then (at least one restricted day still counts).`));
  }
  res.anyAway = day.some(([, k]) => k === "away");
  // Chronological 180-day cap on the combined count.
  let total = 0;
  for (const [d, k] of day) {
    if (!k) continue;
    if (total >= 180) { res.capped = true; continue; }
    total++; if (k === "away") res.away++; else res.restricted++;
  }
  if (res.capped) res.notes.push(why("LOG-DAYS", "Days away and restricted days together reached the 180-day cap; days after that are not counted."));
  if (res.capped && res.away === 0 && res.anyAway) res.notes.push(why("LOG-180", "The case reached 180 restricted days and then became days away: enter 180 restricted, optionally 1 day away, and check the days-away box."));
  // Ranges for display.
  let cur = null;
  for (const [d, k] of day) {
    if (cur && cur.kind === k && addDays(cur.end, 1) === d) cur.end = d;
    else { if (cur && cur.kind) res.ranges.push(cur); cur = { kind: k, start: d, end: d }; }
  }
  if (cur && cur.kind) res.ranges.push(cur);
  const provAway = periods.filter(p => p.kind === "away" && p.source === "provider");
  const provRestr = periods.filter(p => p.kind === "restricted" && p.source === "provider");
  for (const a of provAway) for (const b of provRestr) {
    if (a.start <= (b.end || asOf) && b.start <= (a.end || asOf)) res.notes.push(why("GC-CONFLICT", `Provider directions overlap: days away ${a.start} to ${a.end || "open"} and restricted ${b.start} to ${b.end || "open"}. Days away were counted for the overlap; confirm which direction applies.`));
  }
  if (res.open) res.notes.push(why("LOG-DAYS", `The case is still open. These counts run through ${asOf}; enter an estimate and update the log as the case goes on.`));
  return res;
}

// ---------- Reporting ----------
const parseDT = s => (s && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) ? new Date(s.slice(0, 16)) : null;
export const fmtDT = d => d ? d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) + " (local time)" : "";

export const REPORT_EVENTS = [
  { key: "death", ans: A => A.rp_death === "yes" ? "yes" : isUnsure(A.rp_death) ? U : "no", label: "Death", hours: 8, windowH: 30 * 24, rule: "RPT-DEATH", window: "30 days" },
  { key: "hosp", ans: A => A.rp_hosp === "admitted" ? "yes" : isUnsure(A.rp_hosp) ? U : "no", label: "In-patient hospitalization", hours: 24, windowH: 24, rule: "RPT-SEVERE", window: "24 hours" },
  { key: "amp", ans: A => A.rp_amp === "yes" ? "yes" : isUnsure(A.rp_amp) ? U : "no", label: "Amputation", hours: 24, windowH: 24, rule: "RPT-SEVERE", window: "24 hours" },
  { key: "eye", ans: A => A.rp_eye === "yes" ? "yes" : isUnsure(A.rp_eye) ? U : "no", label: "Loss of an eye", hours: 24, windowH: 24, rule: "RPT-SEVERE", window: "24 hours" },
];

export function incidentDT(A) {
  const i = A.incident;
  if (isUnsure(i) || !i.date || !i.time) return null;
  return parseDT(`${i.date}T${i.time}`);
}

export function reporting(A) {
  const wr = workRelated(A);
  const out = { status: "not", label: "Not reportable", events: [], reasons: [], urgent: false };
  if (wr.status === "no") return { ...out, status: "na", label: "Not required (not work-related)", reasons: [why("EMP-REPORT-ALL", "Only work-related events are reported.")] };
  const inc = incidentDT(A);
  let anyUnsure = false;
  for (const ev of REPORT_EVENTS) {
    const a = ev.ans(A);
    if (a === U) { anyUnsure = true; out.reasons.push(why(ev.rule, `It is not known whether there was ${ev.key === "eye" ? "a loss of an eye" : ev.key === "hosp" ? "an in-patient hospitalization (formal admission, not only observation)" : ev.key === "amp" ? "an amputation (not an avulsion or degloving)" : "a death"}.`)); continue; }
    if (a !== "yes") continue;
    const t = A[`rp_${ev.key}_t`] || {};
    const e = { key: ev.key, label: ev.label, hours: ev.hours, rule: ev.rule, missing: [] };
    const evt = parseDT(t.event), learned = parseDT(t.learned), learnedWR = parseDT(t.learnedWR);
    if (!inc) e.missing.push("incident date and time");
    if (!evt) e.missing.push(`date and time of the ${ev.label.toLowerCase()}`);
    if (!learned) e.missing.push("when you or your agent learned of it");
    if (!learnedWR) e.missing.push("when you learned it was work-related");
    if (inc && evt) {
      const hrs = (evt - inc) / 3600000;
      if (hrs < 0) { e.window = "error"; e.missing.push("event time is before the incident"); }
      else if (hrs <= ev.windowH) e.window = "in";
      else e.window = "out";
    } else e.window = "unknown";
    if (e.window === "out") {
      e.status = "not";
      out.reasons.push(why(ev.rule, `${ev.label} happened more than ${ev.window} after the incident, so it is not reportable under 1904.39. It may still be recordable.`));
      out.events.push(e); continue;
    }
    const starts = [[evt, `the time of the ${ev.label.toLowerCase()}`], [learned, "the time you learned of it"], [learnedWR, "the time you learned it was work-related"]].filter(([d]) => d);
    if (evt && learned && learnedWR) {
      const [start, what] = starts.reduce((a, b) => (b[0] > a[0] ? b : a));
      e.clockStart = start; e.clockWhat = what;
      e.deadline = new Date(start.getTime() + ev.hours * 3600000);
    }
    e.status = e.window === "in" && e.deadline ? "report" : "review";
    out.events.push(e);
  }
  const live = out.events.filter(e => e.status !== "not");
  if (live.length || anyUnsure) {
    if (A.rp_exception === "yes") {
      return { ...out, status: "not", label: "Not reportable (exception)", urgent: false, reasons: [...out.reasons, why("RPT-EXC", "It happened in a motor vehicle accident on a public street or highway outside a construction work zone, or on a commercial or public transportation system. This does not decide whether the case is recordable.")] };
    }
    if (isUnsure(A.rp_exception)) out.reasons.push(why("RPT-EXC", "It is not known whether the public-road or public-transportation exception applies."));
  }
  if (live.length) {
    out.urgent = A.rp_exception === "no" || isUnsure(A.rp_exception);
    const sure = live.filter(e => e.status === "report");
    if (sure.length && A.rp_exception === "no") { out.status = "report"; out.label = "Report to OSHA"; }
    else { out.status = "review"; out.label = "Report to OSHA unless ruled out"; }
    for (const e of live) {
      out.reasons.push(why(e.rule, `${e.label}: report within ${e.hours} hours.`));
      if (e.deadline) out.reasons.push(why("RPT-LATE", `${e.label}: the clock started from ${e.clockWhat}, ${fmtDT(e.clockStart)}. Deadline: ${fmtDT(e.deadline)}.`));
      if (e.missing.length) out.reasons.push(why("RPT-LATE", `${e.label}: the deadline cannot be computed without ${e.missing.join(", ")}. The tool does not guess. Do not wait: report within ${e.hours} hours of the latest of the event, when you learned of it, and when you learned it was work-related.`));
    }
    out.reasons.push(why("RPT-HOW", "Call or visit the nearest OSHA Area Office, call 1-800-321-OSHA (6742), or use the online report form on osha.gov. Voicemail, fax and email do not count."));
  } else if (anyUnsure) { out.status = "review"; out.label = "Needs review"; }
  else if (!out.events.length) out.reasons.push(why("RPT-DEATH", "No death, in-patient hospitalization, amputation or loss of an eye."));
  return out;
}

// ---------- Recordability ----------
export function recordability(A) {
  const reasons = [], review = [], notes = [];
  const wr = workRelated(A);
  if (wr.status === "no") return { status: "not", label: "Not recordable", reasons: wr.reasons, review, notes, wr };
  const nc = newCase(A);
  const sp = special(A);
  const gc = criteria(A);
  const conflict = A.conflict === "yes";
  const gateOpen = wr.status === U || nc.status === U;
  if (nc.status === "no") return { status: "not", label: "Not recordable (not a new case)", reasons: [...wr.reasons, ...nc.reasons], review, notes, wr, nc, sp };
  if (sp.decided === "not") return { status: "not", label: "Not recordable", reasons: [...wr.reasons, ...nc.reasons, ...sp.reasons], review, notes, wr, nc, sp };
  reasons.push(...wr.reasons.filter(r => !/not known|not clear/.test(r.text)), ...nc.reasons.filter(r => !/not known|not clear/.test(r.text)));
  review.push(...wr.reasons.filter(r => /not known|not clear/.test(r.text)), ...nc.reasons.filter(r => /not known|not clear/.test(r.text)));
  const spMet = sp.decided === "recordable";
  if (spMet) reasons.push(...sp.reasons); else { reasons.push(...sp.reasons.filter(r => !sp.review)); if (sp.review) review.push(...sp.reasons); }
  const hearingOnly = sp.type === "hearing";
  const met = hearingOnly ? [] : gc.met;
  if (!hearingOnly) { reasons.push(...met); notes.push(...gc.notes); }
  if (conflict) review.push(why("GC-CONFLICT", "Two or more providers gave conflicting opinions. The employer chooses the most authoritative one."));
  const anyMet = spMet || met.length > 0;
  if (!anyMet) {
    const open = gateOpen || sp.review || (!hearingOnly && gc.unsure.length) || conflict;
    if (!hearingOnly) review.push(...gc.unsure);
    if (open) return { status: "review", label: "Needs review", reasons, review, notes, wr, nc, sp, gc };
    return { status: "not", label: "Not recordable", reasons: [...reasons, why("GC-MT", "None of the general recording criteria are met.")], review, notes, wr, nc, sp, gc };
  }
  if (gateOpen || conflict || (sp.review && !spMet)) return { status: "review", label: "Needs review", reasons, review, notes, wr, nc, sp, gc };
  return { status: "recordable", label: "Recordable", reasons, review, notes, wr, nc, sp, gc, unsureExtra: hearingOnly ? [] : gc.unsure };
}

// ---------- 300 log entry ----------
export function logEntry(A, rec) {
  const sp = rec.sp || special(A);
  const privacy = sp.privacy || A.privacy === "yes";
  const D = A.days, inj = !isUnsure(A.incident) ? A.incident.date : null;
  const needDays = A.gc_away === "yes" || A.gc_restricted === "yes" || A.gc_restricted === "vague" || (sp.decided === "recordable" && sp.type === "removal");
  const days = needDays ? countDays(inj, D) : null;
  let outcome = "Other recordable case", outcomeRule = "LOG-OUTCOME";
  const away = A.gc_away === "yes" || (sp.type === "removal" && sp.decided === "recordable" && A.mr_how === "away") || (days && days.anyAway);
  const restr = A.gc_restricted === "yes" || A.gc_restricted === "vague" || (sp.type === "removal" && sp.decided === "recordable" && A.mr_how === "restricted") || (days && days.restricted > 0);
  if (sp.type !== "hearing") {
    if (A.gc_death === "yes") outcome = "Death";
    else if (away) outcome = "Days away from work";
    else if (restr) outcome = "Job transfer or restriction";
  }
  let mType = sp.mType;
  if (!mType) {
    if (A.m_kind === "injury") mType = "Injury";
    else if (A.m_kind === "illness") mType = { skin: "Skin disorder", resp: "Respiratory condition", poison: "Poisoning", other: "All other illnesses" }[A.m_ill] || "Illness (type not chosen)";
    else mType = "Not chosen: a case from an instantaneous event or exposure is an injury; anything else is an illness";
  }
  return {
    A: "Next number on your log.",
    B: privacy ? "Privacy case" : "[Employee name]",
    C: "[Job title]",
    D: inj || "[Date of injury or onset]",
    E: "[Location]",
    F: privacy
      ? "Describe the injury or illness, the body part, and the object or substance. As a privacy case, the description can leave out private details but must still state the cause and general severity."
      : "Describe the injury or illness, the body part affected, and the object or substance that directly injured or made the person ill.",
    outcome, outcomeRule,
    K: days && !days.error ? days.away : (away ? "[Count days away]" : 0),
    L: days && !days.error ? days.restricted : (restr ? "[Count restricted days]" : 0),
    M: mType, privacy, days,
  };
}

// ---------- Everything ----------
export function evaluate(A, now = new Date()) {
  const rec = recordability(A);
  const log = logStatus(A);
  const rpt = reporting(A);
  const state = stateNote(A);
  const recordableish = rec.status === "recordable" || rec.status === "review";
  const entry = rec.status === "recordable" ? logEntry(A, rec) : null;
  const sp = rec.sp || special(A);
  const actions = [];
  const act = (rule, text) => actions.push(why(rule, text));
  if (rpt.status === "report" || rpt.status === "review" && rpt.urgent) act("RPT-HOW", "Report to OSHA within 8 hours (fatality) or 24 hours (in-patient hospitalization, amputation, loss of an eye).");
  if (log.status === "other") act("COV-SUPERVISE", "Share these results with the employer that supervises the worker day to day; it records the case. Coordinate so the case is recorded only once.");
  const keepsLog = log.status === "required" || log.status === "review";
  if (rec.status === "recordable" && keepsLog) {
    act("LOG-7DAY", "Enter the case on the 300 log and complete the 301 within 7 calendar days of learning about it.");
    act("COV-ESTAB", "Record it on the log of the establishment where it happened. If it happened away from all of your establishments (travel, work at home, field work), use the log of the establishment where the employee normally works.");
    if (entry.privacy) act("LOG-PRIVACY-LIST", "Privacy case: keep a separate, confidential list of case numbers and names.");
    if (entry.days) act("LOG-DAYS", "Keep updating days away or restricted until the employee is back to full duty or the count reaches 180.");
    if (sp.type === "hearing") act("SP-HEARING-RETEST", "Hearing loss: a retest within 30 days that does not confirm the shift lets you leave it off; a confirmed shift is recorded within 7 days of the retest. If later testing shows the shift is not persistent, the entry may be lined out.");
    if (sp.type === "needle") act("SP-NEEDLE", "Needlestick: if the employee is later diagnosed with a bloodborne illness, update the entry and change it from an injury to an illness.");
  }
  if (keepsLog) {
    act("LOG-300A", "After year end, a company executive certifies the 300A summary, which is posted from February 1 to April 30.");
    act("LOG-EFILE", "Electronic submission is not required of everyone. By March 2: 20 to 249 employees in an Appendix A (Subpart E) industry submit the 300A; 250 or more employees submit the 300A; 100 or more employees in an Appendix B (Subpart E) industry also submit 300 and 301 data. Size is based on the previous calendar year. You need the EIN.");
    act("LOG-RETAIN", "Keep the 300, 300A, 301 and privacy list for 5 years after the end of the year, and keep the 300 log updated with newly discovered cases and changes in classification.");
    act("LOG-ACCESS", "Employee access: the 300 log by the end of the next business day; an employee's own 301 by the end of the next business day; the 301 case descriptions to an authorized employee representative within 7 calendar days.");
    act("LOG-GOV", "Give copies of the records within 4 business hours when an authorized government representative asks.");
  }
  if (rec.status !== "not" && recordableish) act("TOOL-UNSURE", "If facts change (a death, hospitalization, new diagnosis or new restriction), run the tool again with the new facts and update the existing log entry rather than start a new case.");
  return { rec, log, rpt, state, entry, actions, factsAsOf: now };
}

export const ruleCite = id => RULES[id] ? `${RULES[id].cite} (${RULES[id].source})` : id;
