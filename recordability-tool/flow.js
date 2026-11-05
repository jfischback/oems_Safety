// The questions, in the order OSHA's decision flow (1904.4) asks them, and when each one applies.
// show(A) decides whether a question applies given the answers so far. A question's show() only looks at earlier answers.
import { workRelated, newCase, special, recordability, isException, naicsExempt, EXCEPTIONS, REPORT_EVENTS, U } from "./engine.js";
import { FIRST_AID, PRIVACY_LIST, PLACES } from "./rules.js";

export const SECTIONS = ["Employer", "Worker", "Case", "Criteria", "Reporting", "Results"];

const wrStage = A => A.injury !== "no" && A.wr_env !== "no";
const afterException = A => wrStage(A) && !isException(A.wr_exception);
const afterTravel = A => afterException(A) && A.wr_travel !== undefined && !(A.wr_travel === "yes" && A.wr_travel_interest === "no");
const afterHome = A => afterTravel(A) && A.wr_home !== undefined && !(A.wr_home === "yes" && A.wr_home_direct === "no");
const wrOpen = A => afterHome(A) && A.preexist !== undefined && !(A.preexist === "yes" && A.preexist_caused === "no");
const ncOpen = A => wrOpen(A) && A.nc_prior !== undefined && newCase(A).status !== "no";
const spDone = A => ncOpen(A) && A.sp_type !== undefined;
const gcOpen = A => spDone(A) && special(A).decided !== "not" && A.sp_type !== "hearing";
const hearingOpen = A => ncOpen(A) && A.sp_type === "hearing";
const reachedCriteriaEnd = A => (gcOpen(A) && A.gc_diag !== undefined) || (hearingOpen(A) && A.hl_hcp !== undefined && special(A).decided !== "not");
const daysNeeded = A => gcOpen(A) && (A.gc_away === "yes" || A.gc_restricted === "yes" || A.gc_restricted === "vague" || (A.sp_type === "removal" && A.mr_voluntary === "no"));
const recordableish = A => ["recordable", "review"].includes(recordability(A).status);
const reportStage = A => workRelated(A).status !== "no" && A.injury !== undefined && A.wr_env !== undefined;

const yn = (help) => ({ type: "ynu", help });
const choice = (options, help) => ({ type: "choice", options, help });

export const QUESTIONS = [
  // ---------------- Employer ----------------
  { id: "state", section: "Employer", type: "state", options: PLACES, text: "Which state or territory did the incident happen in?", why: ["EMP-STATE"], note: "This tool applies federal OSHA rules. Some states run their own OSHA-approved state plans.", show: () => true },
  { id: "emp_small", section: "Employer", ...yn(), text: "Did the whole company, counting every location, have 10 or fewer employees at all times during the last calendar year (not the current year)?", why: ["EMP-SIZE"], note: "If yes, the company does not have to keep routine OSHA 300 and 301 records. It still has to report severe events.", show: () => true },
  { id: "emp_naics", section: "Employer", type: "naics", text: "What is this establishment's NAICS code?", why: ["EMP-NAICS"], note: "Industries listed in Appendix A to Subpart B are partially exempt from keeping routine records. The test is per establishment. Enter at least the first 4 digits.", show: A => A.emp_small !== "yes" },
  { id: "emp_asked", section: "Employer", ...yn(), text: "Has OSHA or the Bureau of Labor Statistics asked the company in writing to keep injury and illness records (for example, for a BLS survey)?", why: ["EMP-ASKED"], note: "If yes, the exemption does not apply.", show: A => A.emp_small === "yes" || (A.emp_small !== undefined && A.emp_naics !== undefined && ["yes", U].includes(naicsExempt(A))) },

  // ---------------- Worker ----------------
  { id: "supervise", section: "Worker", type: "choice", options: [["me", "My company supervises this worker day to day (payroll, temporary, leased or contract worker)"], ["other", "Another employer supervises this worker day to day (for example, a contractor's employee, or an agency worker supervised by the client)"]], text: "Who supervises this worker day to day?", why: ["COV-SUPERVISE"], note: "Payroll alone does not decide. The employer that supervises day to day records the case.", show: () => true },

  // ---------------- Case ----------------
  { id: "injury", section: "Case", ...yn(), text: "Did the employee have an injury or illness, meaning an abnormal condition or disorder such as a cut, sprain, burn, fracture, or an acute or chronic illness?", why: ["INJ-DEF"], show: () => true },
  { id: "incident", section: "Case", type: "incident", text: "When did the incident happen?", why: ["LOG-DAYS", "RPT-SEVERE"], note: "The date goes in column D of the 300 log and starts the day count. The time is used for the report-to-OSHA windows.", show: A => A.injury !== "no" },
  { id: "wr_env", section: "Case", ...yn(), text: "Did an event or exposure in the work environment cause or contribute to it, or significantly aggravate a pre-existing condition?", why: ["WR-ENV"], note: "The work environment is the establishment and any other place the employee works or is present as a condition of employment.", show: A => A.injury !== "no" },
  { id: "wr_exception", section: "Case", type: "choice", options: [...Object.entries(EXCEPTIONS).map(([k, [, t]]) => [k, t]), ["none", "None of these"]], text: "Does one of these exceptions apply?", why: ["WR-EXC-PUBLIC", "WR-EXC-FOOD", "WR-EXC-MENTAL"], note: "Any one of these makes the case not work-related (1904.5(b)(2)).", show: wrStage },
  { id: "wr_travel", section: "Case", ...yn(), text: "Was the employee traveling for work when it happened?", why: ["WR-TRAVEL"], show: afterException },
  { id: "wr_travel_interest", section: "Case", ...yn(), text: "At the time, was the employee doing work in the interest of the employer?", why: ["WR-TRAVEL"], note: "Answer No if it happened at a hotel or other temporary residence while on personal time (judged as for an employee who is not traveling), while commuting between the temporary residence and a fixed job location, or on a personal side trip off a reasonably direct route of travel.", show: A => afterException(A) && A.wr_travel === "yes" },
  { id: "wr_home", section: "Case", ...yn(), text: "Was the employee working at home when it happened?", why: ["WR-HOME"], show: afterTravel },
  { id: "wr_home_direct", section: "Case", ...yn(), text: "Did it come directly from the work (for example, dropping a box of work documents) rather than the general home environment?", why: ["WR-HOME"], show: A => afterTravel(A) && A.wr_home === "yes" },
  { id: "preexist", section: "Case", ...yn(), text: "Was there a pre-existing condition, meaning one that came solely from a non-work event or exposure?", why: ["WR-PREEXIST"], show: afterHome },
  { id: "preexist_caused", section: "Case", ...yn(), text: "Did the work event cause any of these that would not otherwise have happened: death, loss of consciousness, days away, restricted work or job transfer, or new or changed medical treatment?", why: ["WR-PREEXIST"], note: "If none, the aggravation is not significant and the case is not recordable.", show: A => afterHome(A) && A.preexist === "yes" },
  { id: "nc_prior", section: "Case", ...yn(), text: "Has this employee already had a recorded case of the same type to the same body part?", why: ["NC-NEW"], note: "If no, it is a new case.", show: wrOpen },
  { id: "nc_hcp", section: "Case", type: "choice", options: [["new", "A provider says it is a new case"], ["recur", "A provider says it is a recurrence of the earlier case"], ["none", "No provider opinion on this"]], text: "Did a physician or other licensed health care professional give an opinion on whether this is a new case or a recurrence?", why: ["NC-HCP"], note: "If there is an opinion, follow it.", show: A => wrOpen(A) && A.nc_prior === "yes" },
  { id: "nc_chronic", section: "Case", ...yn(), text: "Is this a chronic illness that can recur without new exposure (for example, silicosis or occupational cancer)?", why: ["NC-CHRONIC"], note: "If yes, it is recorded only once.", show: A => wrOpen(A) && A.nc_prior === "yes" && A.nc_hcp !== undefined && !["new", "recur"].includes(A.nc_hcp) },
  { id: "nc_recovered", section: "Case", ...yn(), text: "Had the employee fully recovered (all signs and symptoms gone) before a new workplace event or exposure brought it back?", why: ["NC-NEW"], note: "If yes, it is a new case. If no, update the existing log entry instead.", show: A => wrOpen(A) && A.nc_prior === "yes" && A.nc_chronic === "no" && !["new", "recur"].includes(A.nc_hcp) },

  // ---------------- Criteria: special cases ----------------
  { id: "sp_type", section: "Criteria", type: "choice", options: [["needle", "A needlestick or cut from a sharp object"], ["hearing", "Hearing loss found on an audiogram"], ["tb", "Tuberculosis (TB)"], ["removal", "Medical removal under an OSHA standard (for example lead, cadmium, benzene, formaldehyde, methylene chloride)"], ["none", "None of these"]], text: "Does the case involve any of these?", why: ["SP-NEEDLE", "SP-HEARING", "SP-TB", "SP-REMOVAL"], note: "Each has its own rule. A blood or body fluid splash with no cut is not a needlestick; it goes through the general criteria.", show: ncOpen },
  { id: "ns_contam", section: "Criteria", ...yn(), text: "Was the sharp contaminated with another person's blood or other potentially infectious material?", why: ["SP-NEEDLE"], note: "If no one knows, answer Not sure. That makes the case Needs review, not uncontaminated.", show: A => ncOpen(A) && A.sp_type === "needle" },
  { id: "hl_hcp", section: "Criteria", ...yn(), text: "Has a physician or licensed health care professional determined that the hearing loss is not work-related, or that occupational noise did not significantly aggravate it?", why: ["SP-HEARING-WR"], show: A => ncOpen(A) && A.sp_type === "hearing" },
  { id: "hl_revised", section: "Criteria", ...yn(), text: "Was the baseline audiogram ever revised?", why: ["SP-HEARING"], note: "If yes, enter the revised baseline on the next screen.", show: A => hearingOpen(A) && A.hl_hcp !== "yes" },
  { id: "hl_levels", section: "Criteria", type: "levels", text: "Enter the hearing levels (dB) for each ear.", why: ["SP-HEARING"], note: "Use the baseline audiogram (the revised baseline if it was revised) and the current audiogram, at 2000, 3000 and 4000 Hz. Do not age-correct these numbers yourself.", show: A => hearingOpen(A) && A.hl_hcp !== "yes" },
  { id: "hl_age", section: "Criteria", ...yn(), text: "Do you want to apply the age correction to the shift?", why: ["SP-HEARING-AGE"], note: "Optional. Age correction from Appendix F of 1910.95 may be used for the standard threshold shift, but never for the 25 dB test.", show: A => hearingOpen(A) && A.hl_hcp !== "yes" },
  { id: "hl_age_data", section: "Criteria", type: "agedata", text: "Sex and ages for the age correction", why: ["SP-HEARING-AGE"], note: "Appendix F uses separate tables for males and females, and the employee's age at each audiogram.", show: A => hearingOpen(A) && A.hl_hcp !== "yes" && A.hl_age === "yes" },
  { id: "hl_retest", section: "Criteria", ...yn(), text: "Was the employee retested after the audiogram that showed the shift?", why: ["SP-HEARING-RETEST"], show: A => hearingOpen(A) && A.hl_hcp !== "yes" },
  { id: "hl_retest_data", section: "Criteria", type: "retest", text: "Retest dates and result", why: ["SP-HEARING-RETEST"], note: "The 30-day window is measured from the date of the first audiogram that showed the shift.", show: A => hearingOpen(A) && A.hl_hcp !== "yes" && A.hl_retest === "yes" },
  { id: "tb_exposed", section: "Criteria", ...yn(), text: "Was the employee exposed at work to a known case of active tuberculosis?", why: ["SP-TB"], show: A => ncOpen(A) && A.sp_type === "tb" },
  { id: "tb_positive", section: "Criteria", ...yn(), text: "After that exposure, did the employee have a positive skin test or a TB diagnosis?", why: ["SP-TB"], show: A => ncOpen(A) && A.sp_type === "tb" && A.tb_exposed === "yes" },
  { id: "tb_excl", section: "Criteria", ...yn(), text: "Do any of these apply: the employee lives with someone with active TB; public health identified them as a contact of an unrelated case; a medical investigation shows the infection came from outside work; or it was a positive pre-employment test?", why: ["SP-TB"], show: A => ncOpen(A) && A.sp_type === "tb" && A.tb_exposed === "yes" && A.tb_positive === "yes" },
  { id: "mr_standard", section: "Criteria", type: "choice", options: [["lead", "Lead"], ["cadmium", "Cadmium"], ["benzene", "Benzene"], ["formaldehyde", "Formaldehyde"], ["methylene", "Methylene chloride"], ["other", "Another OSHA standard with medical removal"]], text: "Which OSHA standard required the medical removal?", why: ["SP-REMOVAL"], show: A => ncOpen(A) && A.sp_type === "removal" },
  { id: "mr_voluntary", section: "Criteria", ...yn(), text: "Was this a voluntary removal before the standard's removal levels were reached?", why: ["SP-REMOVAL"], note: "A voluntary early removal is not recorded under 1904.9, but the case still goes through the general criteria.", show: A => ncOpen(A) && A.sp_type === "removal" },
  { id: "mr_how", section: "Criteria", type: "choice", options: [["away", "Kept off work entirely"], ["restricted", "Moved to other work or restricted"]], text: "How was the removal done?", why: ["SP-REMOVAL"], note: "Kept off work is a days-away case; moved or restricted is a restricted case.", show: A => ncOpen(A) && A.sp_type === "removal" && A.mr_voluntary === "no" },

  // ---------------- Criteria: general ----------------
  { id: "gc_death", section: "Criteria", ...yn(), text: "Did the employee die as a result?", why: ["GC-DEATH"], show: gcOpen },
  { id: "gc_away", section: "Criteria", ...yn(), text: "Did the employee miss work after the day of the injury, or did a physician or licensed health care professional recommend days away?", why: ["GC-AWAY"], note: "Do not count the day of the injury. A recommendation of days away counts even if the employee came to work anyway.", show: gcOpen },
  { id: "gc_restricted", section: "Criteria", type: "choice", options: [["yes", "Yes: kept from one or more routine job functions or a full workday, moved to another job, or a provider recommended that"], ["vague", "A provider gave a vague restriction and could not clarify it"], ["no", "No: the employee can do every routine job function and work the full scheduled workday"]], text: "After the day of injury, could the employee do every routine job function and work the full scheduled workday?", why: ["GC-RESTRICT", "GC-RESTRICT-VAGUE"], note: "Count restrictions the employer imposed, restrictions a provider recommended, and job transfers. A routine function is anything done at least once a week. A restriction only on the day of injury does not count. Producing less while doing all routine functions for a full shift does not count.", show: gcOpen },
  { id: "mt_closure", section: "Criteria", type: "choice", options: [["none", "No wound needed closing"], ["firstaid", "Bandages, butterfly bandages or Steri-Strips"], ["mt", "Sutures, staples or skin glue"]], text: "How was the wound closed, if there was one?", why: ["GC-FIRSTAID", "GC-GLUE"], note: "Steri-Strips and butterfly bandages are first aid. Sutures, staples and skin glue are medical treatment.", show: gcOpen },
  { id: "mt_support", section: "Criteria", type: "choice", options: [["none", "No support was used"], ["nonrigid", "Non-rigid support (elastic wrap, non-rigid back belt)"], ["transport", "Splint, sling, neck collar or back board only while transporting the person"], ["rigid", "A brace or device with rigid stays, or that immobilizes a body part"]], text: "Was a support, wrap or brace used?", why: ["GC-FIRSTAID"], note: "An elastic wrap is first aid. A brace with rigid stays is medical treatment.", show: gcOpen },
  { id: "mt_therapy", section: "Criteria", type: "choice", options: [["none", "Neither"], ["massage", "Massage only"], ["pt", "Physical therapy or chiropractic treatment"]], text: "Was there physical therapy, chiropractic care or massage?", why: ["GC-FIRSTAID"], note: "Massage is first aid. Physical therapy and chiropractic treatment are medical treatment.", show: gcOpen },
  { id: "mt_immun", section: "Criteria", type: "choice", options: [["none", "No immunization"], ["tetanus", "Tetanus only"], ["other", "Another immunization (for example hepatitis B vaccine or rabies vaccine)"]], text: "Was an immunization given?", why: ["GC-FIRSTAID"], note: "A tetanus shot is first aid. Other immunizations are medical treatment.", show: gcOpen },
  { id: "mt_rx", section: "Criteria", ...yn(), text: "Was prescription medication given or recommended, including an over-the-counter medication at prescription strength?", why: ["GC-RX"], note: "Prescription strength means more than the single dose on the over-the-counter label. Example: a label dose of ibuprofen is first aid; a dose above the label's single dose is medical treatment. If you can't tell whether the dose was above the label, answer Not sure.", show: gcOpen },
  { id: "mt_rx_diag", section: "Criteria", ...yn(), text: "Was that medication used only for diagnosis (for example, eye drops to dilate pupils)?", why: ["GC-MT"], note: "Medication used only for diagnosis is not treatment.", show: A => gcOpen(A) && A.mt_rx === "yes" },
  { id: "mt_other", section: "Criteria", type: "ynu", firstAid: true, text: "Was any other treatment given that is not on OSHA's first aid list below?", why: ["GC-FIRSTAID", "GC-MT"], note: "Any treatment not on the list is medical treatment, no matter who gives it. Visits only for observation or counseling, and diagnostic tests such as X-rays and blood tests, are not treatment.", show: gcOpen },
  { id: "mt_recommended", section: "Criteria", ...yn(), text: "Did a physician or licensed health care professional recommend treatment beyond first aid, even if the employee refused it or did not follow it?", why: ["GC-MT-RECOMMENDED"], show: gcOpen },
  { id: "gc_loc", section: "Criteria", ...yn(), text: "Did the employee lose consciousness, for any length of time?", why: ["GC-LOC"], show: gcOpen },
  { id: "gc_diag", section: "Criteria", ...yn(), text: "Did a physician or licensed health care professional diagnose cancer, a chronic irreversible disease, a fractured or cracked bone, a punctured eardrum, or a chipped, broken or fractured tooth?", why: ["GC-DIAG", "GC-TOOTH"], note: "Recordable at diagnosis even with no treatment or work restriction.", show: gcOpen },
  { id: "days", section: "Criteria", type: "days", text: "Enter the dates for days away and restricted work", why: ["LOG-DAYS", "LOG-180"], note: "The tool counts calendar days starting the day after the injury, including weekends and holidays. Enter what a provider recommended and what the employee actually did; a provider's recommendation counts even if it was not followed. Leave an end date blank if the period is still going.", show: A => daysNeeded(A) },
  { id: "conflict", section: "Criteria", ...yn(), text: "Did two or more providers give conflicting opinions about this case?", why: ["GC-CONFLICT"], note: "If so, the employer chooses the most authoritative opinion.", show: A => reachedCriteriaEnd(A) && A.sp_type !== "hearing" },
  { id: "privacy", section: "Criteria", type: "ynu", privacyList: true, text: "Does any of these apply to the case?", why: ["LOG-PRIVACY"], note: "If yes, it is a privacy case: the log shows \"Privacy case\" instead of the employee's name.", show: A => reachedCriteriaEnd(A) && recordableish(A) && !special(A).privacy },
  { id: "m_kind", section: "Criteria", type: "choice", options: [["injury", "Injury: it came from an instantaneous event or exposure"], ["illness", "Illness: anything else"]], text: "Is this an injury or an illness?", why: ["LOG-TYPE"], show: A => reachedCriteriaEnd(A) && recordableish(A) && !special(A).mType && !(A.sp_type === "removal" && A.mr_voluntary === "no" && A.mr_standard !== "other" && A.mr_standard !== U) },
  { id: "m_ill", section: "Criteria", type: "choice", options: [["skin", "Skin disorder"], ["resp", "Respiratory condition"], ["poison", "Poisoning"], ["other", "All other illnesses"]], text: "Which type of illness?", why: ["LOG-TYPE"], show: A => reachedCriteriaEnd(A) && recordableish(A) && A.m_kind === "illness" && !special(A).mType },

  // ---------------- Reporting ----------------
  { id: "rp_death", section: "Reporting", ...yn(), text: "Did the employee die?", why: ["RPT-DEATH"], note: "A death within 30 days of the incident is reported within 8 hours of the death.", show: reportStage },
  { id: "rp_death_t", section: "Reporting", type: "times", event: "death", text: "Death: dates and times", why: ["RPT-DEATH", "RPT-LATE"], show: A => reportStage(A) && A.rp_death === "yes" },
  { id: "rp_hosp", section: "Reporting", type: "choice", options: [["admitted", "Yes, formally admitted as an in-patient for care or treatment"], ["observation", "Kept only for observation or diagnostic testing"], ["no", "No hospital admission"]], text: "Was the employee admitted to a hospital?", why: ["RPT-SEVERE", "RPT-DEF"], note: "Only formal in-patient admission for care or treatment within 24 hours of the incident is reportable. If it is unclear whether they were admitted or only observed, answer Not sure.", show: reportStage },
  { id: "rp_hosp_t", section: "Reporting", type: "times", event: "hospital admission", text: "Hospital admission: dates and times", why: ["RPT-SEVERE", "RPT-LATE"], show: A => reportStage(A) && A.rp_hosp === "admitted" },
  { id: "rp_amp", section: "Reporting", ...yn(), text: "Was there an amputation?", why: ["RPT-SEVERE", "RPT-DEF"], note: "Includes a fingertip, with or without bone loss. Does not include an avulsion, degloving, scalping, severed ear or broken tooth. If unclear, answer Not sure.", show: reportStage },
  { id: "rp_amp_t", section: "Reporting", type: "times", event: "amputation", text: "Amputation: dates and times", why: ["RPT-SEVERE", "RPT-LATE"], show: A => reportStage(A) && A.rp_amp === "yes" },
  { id: "rp_eye", section: "Reporting", ...yn(), text: "Did the employee lose an eye?", why: ["RPT-SEVERE"], show: reportStage },
  { id: "rp_eye_t", section: "Reporting", type: "times", event: "loss of the eye", text: "Loss of an eye: dates and times", why: ["RPT-SEVERE", "RPT-LATE"], show: A => reportStage(A) && A.rp_eye === "yes" },
  { id: "rp_exception", section: "Reporting", ...yn(), text: "Did it happen in a motor vehicle accident on a public street or highway (outside a construction work zone), or on a commercial or public transportation system such as a plane, train or bus?", why: ["RPT-EXC"], note: "If yes, it is not reportable to OSHA. This does not decide whether the case is recordable.", show: A => reportStage(A) && REPORT_EVENTS.some(e => e.ans(A) !== "no") },
];

export const byId = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
export const visible = A => QUESTIONS.filter(q => q.show(A));

// Remove answers to questions that no longer apply, repeating until nothing changes.
export function prune(A) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of QUESTIONS) if (q.id in A && !q.show(A)) { delete A[q.id]; changed = true; }
  }
  return A;
}

// The question before or after the given one, among the questions that apply now.
export function step(A, fromId, dir) {
  const vis = visible(A);
  const i = fromId ? vis.findIndex(q => q.id === fromId) : -1;
  const j = i + dir;
  return j >= 0 && j < vis.length ? vis[j].id : null;
}

export { FIRST_AID, PRIVACY_LIST };
